import type { FileEntry, DirectoryListing, SearchResult } from '../types';

const PAGE_SIZE = 100;
const SEARCH_MAX_PAGES = 10; // Cap search to 10,000 objects max
const SEARCH_MAX_RESULTS = 50;

function objectToFileEntry(obj: R2Object): FileEntry {
  return {
    name: obj.key.split('/').filter(Boolean).pop() || obj.key,
    key: obj.key,
    size: obj.size,
    lastModified: obj.uploaded.toISOString(),
    type: 'file',
    contentType: obj.httpMetadata?.contentType,
  };
}

function prefixToDirectoryEntry(prefix: string): FileEntry {
  const parts = prefix.replace(/\/$/, '').split('/');
  return {
    name: parts[parts.length - 1],
    key: prefix,
    size: 0,
    lastModified: '',
    type: 'directory',
  };
}

export async function listDirectory(
  bucket: R2Bucket,
  path: string,
  cursor?: string
): Promise<DirectoryListing> {
  const prefix = path ? (path.endsWith('/') ? path : path + '/') : '';

  const listed = await bucket.list({
    prefix,
    delimiter: '/',
    limit: PAGE_SIZE,
    cursor,
  });

  const entries: FileEntry[] = [];

  // Directories first
  if (listed.delimitedPrefixes) {
    for (const prefix of listed.delimitedPrefixes) {
      entries.push(prefixToDirectoryEntry(prefix));
    }
  }

  // Then files
  for (const obj of listed.objects) {
    // Skip the directory marker itself if present
    if (obj.key === prefix) continue;
    entries.push(objectToFileEntry(obj));
  }

  return {
    path: prefix,
    entries,
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : undefined,
  };
}

// F4: Capped search — scans at most SEARCH_MAX_PAGES pages
// F9: Removed broken cursor-based pagination — search is always from the start
export async function searchFiles(
  bucket: R2Bucket,
  query: string
): Promise<SearchResult> {
  const lowerQuery = query.toLowerCase();
  const results: FileEntry[] = [];

  let currentCursor: string | undefined;
  let pagesScanned = 0;
  let searchExhausted = true;

  while (results.length < SEARCH_MAX_RESULTS && pagesScanned < SEARCH_MAX_PAGES) {
    const listed = await bucket.list({
      limit: 1000,
      cursor: currentCursor,
    });
    pagesScanned++;

    for (const obj of listed.objects) {
      if (obj.key.toLowerCase().includes(lowerQuery)) {
        results.push(objectToFileEntry(obj));
        if (results.length >= SEARCH_MAX_RESULTS) break;
      }
    }

    if (!listed.truncated) break;
    currentCursor = listed.cursor;

    // If we hit the page limit and there are more objects, mark as partial
    if (pagesScanned >= SEARCH_MAX_PAGES) {
      searchExhausted = false;
    }
  }

  return {
    results,
    query,
    truncated: !searchExhausted,
  };
}

// F8: Head-only check for file metadata without fetching body
export async function getFileHead(
  bucket: R2Bucket,
  key: string
): Promise<{ size: number; contentType: string } | null> {
  const obj = await bucket.head(key);
  if (!obj) return null;

  return {
    size: obj.size,
    contentType: obj.httpMetadata?.contentType || guessContentType(key),
  };
}

export async function getFileForPreview(
  bucket: R2Bucket,
  key: string
): Promise<{ body: ReadableStream; contentType: string; size: number } | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;

  const contentType = obj.httpMetadata?.contentType || guessContentType(key);

  return {
    body: obj.body,
    contentType,
    size: obj.size,
  };
}

export async function getFileForDownload(
  bucket: R2Bucket,
  key: string
): Promise<{ body: ReadableStream; contentType: string; size: number; name: string } | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;

  const name = key.split('/').pop() || key;
  const contentType = obj.httpMetadata?.contentType || 'application/octet-stream';

  return {
    body: obj.body,
    contentType,
    size: obj.size,
    name,
  };
}

function guessContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'text/typescript',
    tsx: 'text/typescript',
    js: 'application/javascript',
    jsx: 'application/javascript',
    json: 'application/json',
    md: 'text/markdown',
    html: 'text/html',
    css: 'text/css',
    py: 'text/x-python',
    go: 'text/x-go',
    rs: 'text/x-rust',
    java: 'text/x-java',
    sh: 'text/x-sh',
    bash: 'text/x-sh',
    yaml: 'text/yaml',
    yml: 'text/yaml',
    toml: 'text/toml',
    sql: 'text/x-sql',
    xml: 'application/xml',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    ico: 'image/x-icon',
    pdf: 'application/pdf',
    txt: 'text/plain',
  };
  return map[ext || ''] || 'application/octet-stream';
}
