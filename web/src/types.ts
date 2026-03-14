export interface FileEntry {
  name: string;
  key: string;
  size: number;
  lastModified: string;
  type: 'file' | 'directory';
  contentType?: string;
}

export interface DirectoryListing {
  path: string;
  entries: FileEntry[];
  truncated: boolean;
  cursor?: string;
}

export interface SearchResult {
  results: FileEntry[];
  query: string;
  truncated: boolean;
  cursor?: string;
}
