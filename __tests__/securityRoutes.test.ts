import type { Express } from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import http from 'http';
import type { JwtPayload } from '../backend/src/middleware/auth';

jest.mock('@google/genai', () => ({
  GoogleGenAI: class GoogleGenAI {},
}));

describe('backend route protection', () => {
  let app: Express;
  let db: typeof import('../backend/src/db').db;
  let generateToken: typeof import('../backend/src/middleware/auth').generateToken;
  let server: Server | null = null;
  let baseUrl = '';
  let initialData: unknown;
  const originalEnv = { ...process.env };

  const createToken = (overrides: Partial<JwtPayload> = {}) =>
    generateToken({
      id: overrides.id ?? 1,
      email: overrides.email ?? 'admin@petbhai.test',
      name: overrides.name ?? 'Test User',
      isAdmin: overrides.isAdmin,
      isPlusMember: overrides.isPlusMember,
    });

  const seedPost = (authorId = 1) => ({
    id: 101,
    author: {
      id: authorId,
      name: 'Post Owner',
    },
    content: 'Protected post',
    likes: [] as number[],
    comments: [],
    timestamp: new Date().toISOString(),
  });

  const requestJson = async (path: string, init: RequestInit = {}) => {
    const targetUrl = new URL(path, baseUrl);
    const body = typeof init.body === 'string' ? init.body : undefined;
    const headers = {
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...(init.headers as Record<string, string> | undefined),
      ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {}),
    };

    const result = await new Promise<{ status: number; text: string }>((resolve, reject) => {
      const request = http.request(
        targetUrl,
        {
          method: init.method || 'GET',
          headers,
        },
        (response) => {
          let text = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            text += chunk;
          });
          response.on('end', () => {
            resolve({ status: response.statusCode || 500, text });
          });
        }
      );

      request.on('error', reject);

      if (body) {
        request.write(body);
      }

      request.end();
    });

    return {
      response: { status: result.status },
      payload: result.text ? (JSON.parse(result.text) as Record<string, unknown>) : null,
    };
  };

  beforeAll(async () => {
    jest.resetModules();
    process.env.VERCEL = '1';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_that_is_at_least_32_chars_long';

    const appModule = await import('../backend/src/index');
    const dbModule = await import('../backend/src/db');
    const authModule = await import('../backend/src/middleware/auth');

    app = appModule.default;
    db = dbModule.db;
    generateToken = authModule.generateToken;
    initialData = JSON.parse(JSON.stringify(db.data));
  });

  beforeEach(async () => {
    db.data = JSON.parse(JSON.stringify(initialData)) as typeof db.data;

    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server?.once('listening', () => resolve());
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    server = null;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects deleting a post without authentication', async () => {
    db.data.posts = [seedPost()];

    const { response, payload } = await requestJson('/api/posts/101', {
      method: 'DELETE',
    });

    expect(response.status).toBe(401);
    expect(payload).toEqual(expect.objectContaining({ error: 'Authentication required' }));
    expect(db.data.posts).toHaveLength(1);
  });

  it('rejects deleting another user\'s post even with a valid token', async () => {
    db.data.posts = [seedPost(1)];

    const { response, payload } = await requestJson('/api/posts/101', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${createToken({ id: 2, email: 'other@petbhai.test' })}`,
      },
    });

    expect(response.status).toBe(403);
    expect(payload).toEqual(
      expect.objectContaining({ message: 'You can only delete your own posts' })
    );
    expect(db.data.posts).toHaveLength(1);
  });

  it('allows deleting a post when the authenticated user is the owner', async () => {
    db.data.posts = [seedPost(7)];

    const { response, payload } = await requestJson('/api/posts/101', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${createToken({ id: 7, email: 'owner@petbhai.test' })}`,
      },
    });

    expect(response.status).toBe(200);
    expect(payload).toEqual(expect.objectContaining({ message: 'Post deleted successfully' }));
    expect(db.data.posts).toHaveLength(0);
  });

  it('requires authentication on the AI chat endpoint before processing the prompt', async () => {
    const { response, payload } = await requestJson('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'hello' }),
    });

    expect(response.status).toBe(401);
    expect(payload).toEqual(expect.objectContaining({ error: 'Authentication required' }));
  });

  it('requires authentication on the AI image endpoint', async () => {
    const { response, payload } = await requestJson('/api/ai/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'generate a pet poster' }),
    });

    expect(response.status).toBe(401);
    expect(payload).toEqual(expect.objectContaining({ error: 'Authentication required' }));
  });
});