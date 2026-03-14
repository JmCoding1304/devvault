import { Hono } from 'hono';
import type { Env } from '../types';
import { listDirectory, searchFiles, getFileHead, getFileForPreview, getFileForDownload } from '../lib/r2';
import { sanitizePath, safeContentDisposition } from '../lib/sanitize';

const MAX_PREVIEW_SIZE = 5 * 1024 * 1024; // 5MB

const files = new Hono<{ Bindings: Env }>();

// Directory listing
files.get('/files', async (c) => {
  const rawPath = c.req.query('path') || '';
  const path = rawPath === '' ? '' : sanitizePath(rawPath);

  if (path === null) {
    return c.json({ error: 'Invalid path' }, 400);
  }

  const cursor = c.req.query('cursor');
  const listing = await listDirectory(c.env.VAULT_BUCKET, path, cursor);
  return c.json(listing);
});

// File search
files.get('/search', async (c) => {
  const query = c.req.query('q');

  if (!query || query.length < 2) {
    return c.json({ error: 'Query parameter "q" is required (minimum 2 characters)' }, 400);
  }

  const results = await searchFiles(c.env.VAULT_BUCKET, query);
  return c.json(results);
});

// File download (streams with Content-Disposition: attachment)
files.get('/download/*', async (c) => {
  const rawKey = c.req.path.replace('/api/download/', '');
  const key = sanitizePath(rawKey);

  if (!key) {
    return c.json({ error: 'Invalid file path' }, 400);
  }

  const file = await getFileForDownload(c.env.VAULT_BUCKET, key);
  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': safeContentDisposition(file.name),
      'Content-Length': file.size.toString(),
    },
  });
});

// File preview (inline content with appropriate Content-Type)
files.get('/preview/*', async (c) => {
  const rawKey = c.req.path.replace('/api/preview/', '');
  const key = sanitizePath(rawKey);

  if (!key) {
    return c.json({ error: 'Invalid file path' }, 400);
  }

  // F8: Check size with head() before fetching body
  const head = await getFileHead(c.env.VAULT_BUCKET, key);
  if (!head) {
    return c.json({ error: 'File not found' }, 404);
  }

  if (head.size > MAX_PREVIEW_SIZE) {
    return c.json({ error: 'File too large for preview. Use download instead.' }, 413);
  }

  const file = await getFileForPreview(c.env.VAULT_BUCKET, key);
  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': file.size.toString(),
      'Cache-Control': 'private, max-age=300',
      // F6: Security headers to prevent XSS from backed-up HTML/SVG files
      'Content-Security-Policy': 'sandbox',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

export { files };
