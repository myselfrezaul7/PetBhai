type StreamEventResult = {
  raw: string;
};

type PostResponse = {
  id: number;
  author: {
    id: number;
    name: string;
  };
  content: string;
};

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';
const runId = Date.now();

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
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
  console.log(`Running post stream smoke test against ${baseUrl}`);

  const streamResponse = await fetch(`${baseUrl}/posts/stream`, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
  });

  assert(
    streamResponse.status === 200,
    `Expected 200 from stream endpoint, got ${streamResponse.status}`
  );
  assert(
    streamResponse.headers.get('content-type')?.includes('text/event-stream'),
    `Expected text/event-stream content type, got ${streamResponse.headers.get('content-type')}`
  );
  assert(streamResponse.body, 'Stream response body is missing');

  const reader = streamResponse.body!.getReader();

  try {
    await waitForStreamChunk(reader, (text) => text.includes('event: connected'), 8000);

    const createdPostResponse = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: {
          id: 900001,
          name: 'Stream Smoke',
        },
        content: `Realtime stream smoke post ${runId}`,
      }),
    });

    const createdPostPayload = (await createdPostResponse.json()) as PostResponse;
    assert(
      createdPostResponse.status === 201,
      `Expected 201 on post creation, got ${createdPostResponse.status}`
    );
    assert(Boolean(createdPostPayload?.id), 'Created post response is missing id');

    const postId = createdPostPayload.id;

    const updateEvent = await waitForStreamChunk(
      reader,
      (text) =>
        text.includes('event: post-update') &&
        text.includes('post-created') &&
        text.includes(`"postId":${postId}`),
      10000
    );

    assert(
      updateEvent.raw.includes('post-update'),
      'Did not receive post-update event in stream payload'
    );

    const cleanupResponse = await fetch(
      `${baseUrl}/posts/${encodeURIComponent(String(postId))}?authorId=900001`,
      {
        method: 'DELETE',
      }
    );

    assert(
      cleanupResponse.status === 200,
      `Cleanup delete failed for smoke post. Expected 200, got ${cleanupResponse.status}`
    );

    console.log('✅ Post stream smoke test passed');
  } finally {
    await reader.cancel();
  }
};

run().catch((error) => {
  console.error('❌ Post stream smoke test failed');
  console.error(error);
  process.exitCode = 1;
});
