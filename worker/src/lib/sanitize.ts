// Validate and sanitize a file path/key
export function sanitizePath(path: string): string | null {
  // Decode to catch encoded traversal attempts
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return null;
  }

  // Reject null bytes
  if (decoded.includes('\0')) return null;

  // Reject directory traversal
  const segments = decoded.split('/');
  for (const segment of segments) {
    if (segment === '..' || segment === '.') return null;
  }

  // Reject paths starting with /
  if (decoded.startsWith('/')) return null;

  return decoded;
}

// Encode filename for Content-Disposition header (RFC 5987)
export function safeContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(/'/g, '%27');
  return `attachment; filename*=UTF-8''${encoded}`;
}
