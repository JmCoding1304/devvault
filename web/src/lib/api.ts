import type { DirectoryListing, SearchResult } from '../types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error || res.statusText, res.status);
  }
  return res.json();
}

export async function fetchDirectory(path: string, cursor?: string): Promise<DirectoryListing> {
  const params = new URLSearchParams();
  if (path) params.set('path', path);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return fetchJson<DirectoryListing>(`/api/files${query ? `?${query}` : ''}`);
}

export async function searchFiles(query: string, cursor?: string): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query });
  if (cursor) params.set('cursor', cursor);
  return fetchJson<SearchResult>(`/api/search?${params}`);
}

export function getDownloadUrl(key: string): string {
  return `/api/download/${key}`;
}

export function getPreviewUrl(key: string): string {
  return `/api/preview/${key}`;
}
