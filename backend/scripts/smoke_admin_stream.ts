export {};

type AuthResponse = {
  user: {
    id: number | string;
    email: string;
  };
  token: string;
};

type Product = {
  id: number;
  name: string;
  price: number;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
};

type OrderCreateResponse = {
  order: {
    orderId: string;
    status?: string;
  };
};

type StreamEventResult = {
  raw: string;
};

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';
const runId = Date.now();
const adminEmail = process.env.ADMIN_SMOKE_EMAIL || 'petbhaibd@gmail.com';

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const request = async <T>(path: string, init: RequestInit, expectedStatus: number): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payloadText = await response.text();
  const payload = payloadText ? JSON.parse(payloadText) : null;

  if (response.status !== expectedStatus) {
    throw new Error(
      `Unexpected status for ${path}: expected ${expectedStatus}, got ${response.status}. Payload: ${payloadText}`
    );
  }

  return payload as T;
};

const readWithTimeout = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number
): Promise<ReadableStreamReadResult<Uint8Array>> => {
  return await Promise.race([
    reader.read(),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timed out after ${timeoutMs}ms while waiting for stream data`)),
        timeoutMs
      );
    }),
  ]);
};

const waitForStreamChunk = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  matcher: (decodedText: string) => boolean,
  timeoutMs: number
): Promise<StreamEventResult> => {
  const decoder = new TextDecoder();
  const start = Date.now();
  let collected = '';

  while (Date.now() - start < timeoutMs) {
    const result = await readWithTimeout(reader, Math.min(2000, timeoutMs));
    if (result.done) {
      break;
    }

    const decoded = decoder.decode(result.value, { stream: true });
    collected += decoded;

    if (matcher(collected)) {
      return { raw: collected };
    }
  }

  throw new Error(`Expected stream event not received within ${timeoutMs}ms`);
};

const run = async (): Promise<void> => {
  console.log(`Running admin stream smoke test against ${baseUrl}`);

  const adminAuth = await request<AuthResponse>(
    '/auth/social',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Stream Smoke',
        email: adminEmail,
      }),
    },
    200
  );

  const adminToken = adminAuth.token;
  assert(Boolean(adminToken), 'Admin token missing from social login');

  const streamResponse = await fetch(
    `${baseUrl}/admin/stream?token=${encodeURIComponent(adminToken)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
    }
  );

  assert(streamResponse.status === 200, `Expected 200 from admin stream, got ${streamResponse.status}`);
  assert(
    streamResponse.headers.get('content-type')?.includes('text/event-stream'),
    `Expected text/event-stream content type, got ${streamResponse.headers.get('content-type')}`
  );
  assert(streamResponse.body, 'Admin stream response body is missing');

  const reader = streamResponse.body!.getReader();

  try {
    await waitForStreamChunk(reader, (text) => text.includes('event: connected'), 8000);

    const products = await request<Product[]>(
      '/products',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      200
    );

    const availableProduct =
      products.find((item) => item.stockStatus !== 'out-of-stock') || products[0];
    assert(availableProduct, 'No product available for smoke test order creation');

    const createdOrder = await request<OrderCreateResponse>(
      '/orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: availableProduct.id,
              name: availableProduct.name,
              quantity: 1,
              price: availableProduct.price,
            },
          ],
          shippingAddress: {
            name: 'Admin Stream Smoke',
            phone: '01711223344',
            address: 'House 5, Road 3, Dhaka',
            city: 'Dhaka',
            district: 'Dhaka',
          },
          paymentMethod: 'Cash on Delivery',
        }),
      },
      201
    );

    const orderId = createdOrder?.order?.orderId;
    assert(Boolean(orderId), 'Order ID missing after order creation');

    const orderCreatedEvent = await waitForStreamChunk(
      reader,
      (text) =>
        text.includes('event: order-created') &&
        text.includes(`"orderId":"${String(orderId)}"`),
      12000
    );

    assert(
      orderCreatedEvent.raw.includes('order-created'),
      'Did not receive order-created event in admin stream payload'
    );

    const updatedOrder = await request<{ order: { status?: string } }>(
      `/orders/${encodeURIComponent(String(orderId))}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'processing',
          note: `Admin stream smoke update ${runId}`,
          trackingNumber: `ADM-STREAM-${runId}`,
        }),
      },
      200
    );

    assert(updatedOrder?.order?.status === 'processing', 'Order status update did not persist');

    const orderUpdatedEvent = await waitForStreamChunk(
      reader,
      (text) =>
        text.includes('event: order-updated') &&
        text.includes(`"orderId":"${String(orderId)}"`) &&
        text.includes('"status":"processing"'),
      12000
    );

    assert(
      orderUpdatedEvent.raw.includes('order-updated'),
      'Did not receive order-updated event in admin stream payload'
    );

    console.log('✅ Admin stream smoke test passed');
  } finally {
    await reader.cancel();
  }
};

run().catch((error) => {
  console.error('❌ Admin stream smoke test failed');
  console.error(error);
  process.exitCode = 1;
});
