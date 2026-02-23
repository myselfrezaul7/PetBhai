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

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';
const runId = Date.now();
const customerEmail = `order-smoke-${runId}@example.com`;
const customerPassword = 'SmokeTest123A';
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

const run = async (): Promise<void> => {
  console.log(`Running admin order-status smoke test against ${baseUrl}`);

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

  const customerSignup = await request<AuthResponse>(
    '/auth/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Order Smoke ${runId}`,
        email: customerEmail,
        password: customerPassword,
      }),
    },
    201
  );

  const customerToken = customerSignup.token;
  assert(Boolean(customerToken), 'Customer token missing after signup');

  const adminSocial = await request<AuthResponse>(
    '/auth/social',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Admin',
        email: adminEmail,
      }),
    },
    200
  );

  const adminToken = adminSocial.token;
  assert(Boolean(adminToken), 'Admin token missing from social login');

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
          name: 'Smoke Customer',
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

  await request(
    `/orders/${encodeURIComponent(String(orderId))}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        status: 'processing',
      }),
    },
    403
  );

  await request(
    `/orders/${encodeURIComponent(String(orderId))}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'processing',
        note: 'Admin status change',
        injected: 'should-fail',
      }),
    },
    400
  );

  const updated = await request<{ order: { status?: string; trackingNumber?: string } }>(
    `/orders/${encodeURIComponent(String(orderId))}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'processing',
        note: 'Admin status change',
        trackingNumber: `SMOKE-${runId}`,
      }),
    },
    200
  );

  assert(updated?.order?.status === 'processing', 'Order status was not updated by admin');
  assert(
    updated?.order?.trackingNumber === `SMOKE-${runId}`,
    'Tracking number was not persisted on valid admin update'
  );

  console.log('✅ Admin order-status smoke test passed');
};

run().catch((error) => {
  console.error('❌ Admin order-status smoke test failed');
  console.error(error);
  process.exitCode = 1;
});
