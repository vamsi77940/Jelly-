import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecureBackendClient } from '@/lib/ai/secureBackendClient';
import * as firebase from '@/lib/firebase';

vi.mock('@/lib/firebase', () => ({
  getAppCheckToken: vi.fn(),
  isSecureBackendConfigured: vi.fn(),
}));

describe('SecureBackendClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('isConfigured is false for an empty URL', () => {
    expect(new SecureBackendClient('').isConfigured()).toBe(false);
  });

  it('isConfigured is true when a URL is set', () => {
    expect(new SecureBackendClient('https://example.com/chat').isConfigured()).toBe(true);
  });

  it('sends the App Check token as a header and returns the response text', async () => {
    vi.mocked(firebase.getAppCheckToken).mockResolvedValue('fake-token');

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Hello from the assistant' }),
    });

    const client = new SecureBackendClient('https://example.com/chat');
    const result = await client.send([], 'hi');

    expect(result).toBe('Hello from the assistant');
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['X-Firebase-AppCheck']).toBe('fake-token');
  });

  it('throws the server-provided error message on a non-ok response', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Origin not allowed.' }),
    });

    const client = new SecureBackendClient('https://example.com/chat');
    await expect(client.send([], 'hi')).rejects.toThrow('Origin not allowed.');
  });

  it('throws a clear error when the response has no text', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const client = new SecureBackendClient('https://example.com/chat');
    await expect(client.send([], 'hi')).rejects.toThrow('empty response');
  });
});
