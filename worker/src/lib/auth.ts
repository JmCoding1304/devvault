import type { Context, Next } from 'hono';
import type { Env } from '../types';

// Validate Cloudflare Access JWT on API routes.
// The CF_ACCESS_TEAM_DOMAIN env var should be set to your team domain
// (e.g., "myteam" for myteam.cloudflareaccess.com).
// If not set, auth is disabled (local dev mode).
export async function cfAccessAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const teamDomain = (c.env as any).CF_ACCESS_TEAM_DOMAIN;

  // Skip auth in local dev (no team domain configured)
  if (!teamDomain) {
    return next();
  }

  const jwt = c.req.header('Cf-Access-Jwt-Assertion');
  if (!jwt) {
    return c.json({ error: 'Unauthorized: missing access token' }, 401);
  }

  // Verify the JWT has valid structure (3 parts, base64url encoded)
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return c.json({ error: 'Unauthorized: invalid token format' }, 401);
  }

  // Decode and check basic claims (expiry, audience)
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return c.json({ error: 'Unauthorized: token expired' }, 401);
    }

    if (!payload.iss?.includes(teamDomain)) {
      return c.json({ error: 'Unauthorized: invalid issuer' }, 401);
    }
  } catch {
    return c.json({ error: 'Unauthorized: malformed token' }, 401);
  }

  return next();
}
