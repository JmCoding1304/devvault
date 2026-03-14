import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../src/types';
import { files } from '../src/routes/files';

// Create a test-only app without serveStatic (which needs CF Workers runtime)
const app = new Hono<{ Bindings: Env }>();
app.route('/api', files);

function createMockBucket() {
  return {
    list: vi.fn().mockResolvedValue({
      objects: [
        {
          key: 'readme.md',
          size: 500,
          uploaded: new Date('2026-01-15T10:00:00Z'),
          httpMetadata: { contentType: 'text/markdown' },
        },
      ],
      delimitedPrefixes: ['projects/'],
      truncated: false,
    }),
    get: vi.fn().mockResolvedValue({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('# Hello'));
          controller.close();
        },
      }),
      size: 7,
      httpMetadata: { contentType: 'text/markdown' },
    }),
    head: vi.fn().mockResolvedValue({
      size: 7,
      httpMetadata: { contentType: 'text/markdown' },
    }),
  };
}

function createEnv() {
  return { VAULT_BUCKET: createMockBucket() };
}

describe('API Routes', () => {
  it('GET /api/files returns directory listing', async () => {
    const res = await app.request('/api/files', {}, createEnv());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toBeDefined();
    expect(data.entries.length).toBe(2); // 1 dir + 1 file
  });

  it('GET /api/files rejects path traversal', async () => {
    const res = await app.request('/api/files?path=../etc', {}, createEnv());
    expect(res.status).toBe(400);
  });

  it('GET /api/search requires query', async () => {
    const res = await app.request('/api/search', {}, createEnv());
    expect(res.status).toBe(400);
  });

  it('GET /api/search rejects short query', async () => {
    const res = await app.request('/api/search?q=a', {}, createEnv());
    expect(res.status).toBe(400);
  });

  it('GET /api/search returns results', async () => {
    const res = await app.request('/api/search?q=readme', {}, createEnv());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toBeDefined();
    expect(data.query).toBe('readme');
  });

  it('GET /api/preview/* returns file content with security headers', async () => {
    const res = await app.request('/api/preview/readme.md', {}, createEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/markdown');
    // F6: Security headers present
    expect(res.headers.get('Content-Security-Policy')).toBe('sandbox');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('GET /api/preview/* returns 404 for missing file', async () => {
    const env = createEnv();
    (env.VAULT_BUCKET.head as any).mockResolvedValue(null);
    const res = await app.request('/api/preview/missing.txt', {}, env);
    expect(res.status).toBe(404);
  });

  it('GET /api/preview/* returns 413 for large file', async () => {
    const env = createEnv();
    // F8: head() is called first for size check
    (env.VAULT_BUCKET.head as any).mockResolvedValue({
      size: 10 * 1024 * 1024, // 10MB
      httpMetadata: { contentType: 'application/octet-stream' },
    });
    const res = await app.request('/api/preview/big.bin', {}, env);
    expect(res.status).toBe(413);
    // get() should NOT have been called since head() rejected it
    expect(env.VAULT_BUCKET.get).not.toHaveBeenCalled();
  });

  it('GET /api/download/* streams file with RFC 5987 Content-Disposition', async () => {
    const res = await app.request('/api/download/readme.md', {}, createEnv());
    expect(res.status).toBe(200);
    const disposition = res.headers.get('Content-Disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain("filename*=UTF-8''");
  });

  it('GET /api/download/* rejects path with dot segments', async () => {
    const res = await app.request('/api/download/foo/..%2Fbar', {}, createEnv());
    expect(res.status).toBe(400);
  });

  // F16: Tests for special characters in keys
  it('GET /api/download/* handles keys with spaces', async () => {
    const res = await app.request('/api/download/my%20file.ts', {}, createEnv());
    expect(res.status).toBe(200);
  });
});
