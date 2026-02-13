import { apiRequest, getErrorMessage } from '../../services/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed JSON data for successful requests', async () => {
    const mockPayload = [{ id: 1, name: 'Dog Food' }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockPayload),
    } as unknown as Response);

    const data = await apiRequest<Array<{ id: number; name: string }>>('/products');

    expect(data).toEqual(mockPayload);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('throws backend error message for non-OK responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ message: 'Invalid request payload' }),
    } as unknown as Response);

    await expect(apiRequest('/products')).rejects.toThrow('Invalid request payload');
  });

  it('throws timeout error when request exceeds timeout', async () => {
    jest.useFakeTimers();

    global.fetch = jest.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        })
    );

    const requestPromise = apiRequest('/products', { timeoutMs: 10 });
    jest.advanceTimersByTime(20);

    await expect(requestPromise).rejects.toThrow('Request timed out. Please try again.');

    jest.useRealTimers();
  });

  it('returns fallback error message for unknown errors', () => {
    expect(getErrorMessage('oops', 'Default error')).toBe('Default error');
  });
});
