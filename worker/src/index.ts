import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Env } from './types';
import { files } from './routes/files';
import { cfAccessAuth } from './lib/auth';

// @ts-expect-error — __STATIC_CONTENT_MANIFEST is injected at deploy time by wrangler
import manifest from '__STATIC_CONTENT_MANIFEST';

const app = new Hono<{ Bindings: Env }>();

// Error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Auth middleware for API routes (F1: validates Cloudflare Access JWT)
app.use('/api/*', cfAccessAuth);

// API routes
app.route('/api', files);

// Serve static files (React build from web/dist)
app.get('*', serveStatic({ root: './', manifest }));

// SPA fallback — serve index.html for client-side routing
app.get('*', serveStatic({ path: './index.html', manifest }));

export default app;
