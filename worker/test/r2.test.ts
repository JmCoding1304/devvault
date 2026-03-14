import { describe, it, expect, vi } from 'vitest';
import { listDirectory, searchFiles } from '../src/lib/r2';

// Mock R2 bucket
function createMockBucket(objects: any[], delimitedPrefixes: string[] = []) {
  return {
    list: vi.fn().mockResolvedValue({
      objects,
      delimitedPrefixes,
      truncated: false,
      cursor: undefined,
    }),
    get: vi.fn(),
    head: vi.fn(),
  } as unknown as R2Bucket;
}

function mockObject(key: string, size = 100): any {
  return {
    key,
    size,
    uploaded: new Date('2026-01-15T10:00:00Z'),
    httpMetadata: { contentType: 'application/octet-stream' },
  };
}

describe('listDirectory', () => {
  it('returns entries for root directory', async () => {
    const bucket = createMockBucket(
      [mockObject('readme.md', 500)],
      ['projects/', 'docs/']
    );

    const result = await listDirectory(bucket, '');

    expect(result.path).toBe('');
    expect(result.entries).toHaveLength(3);
    // Directories first
    expect(result.entries[0]).toEqual({
      name: 'projects',
      key: 'projects/',
      size: 0,
      lastModified: '',
      type: 'directory',
    });
    expect(result.entries[1]).toEqual({
      name: 'docs',
      key: 'docs/',
      size: 0,
      lastModified: '',
      type: 'directory',
    });
    // Then files
    expect(result.entries[2].name).toBe('readme.md');
    expect(result.entries[2].type).toBe('file');
  });

  it('lists subdirectory with prefix', async () => {
    const bucket = createMockBucket(
      [mockObject('projects/app/index.ts', 200)],
      ['projects/app/src/']
    );

    const result = await listDirectory(bucket, 'projects/app');

    expect(bucket.list).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'projects/app/', delimiter: '/' })
    );
    expect(result.path).toBe('projects/app/');
  });

  it('handles empty directory', async () => {
    const bucket = createMockBucket([], []);
    const result = await listDirectory(bucket, 'empty/');
    expect(result.entries).toHaveLength(0);
    expect(result.truncated).toBe(false);
  });

  it('skips directory marker object', async () => {
    const bucket = createMockBucket(
      [mockObject('docs/', 0), mockObject('docs/readme.md', 300)],
      []
    );

    const result = await listDirectory(bucket, 'docs');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].name).toBe('readme.md');
  });
});

describe('searchFiles', () => {
  it('finds files matching query (case-insensitive)', async () => {
    const bucket = createMockBucket([
      mockObject('src/index.ts'),
      mockObject('src/Package.json'),
      mockObject('docs/readme.md'),
      mockObject('lib/package.json'),
    ]);

    const result = await searchFiles(bucket, 'package');

    expect(result.query).toBe('package');
    expect(result.results).toHaveLength(2);
    expect(result.results[0].key).toBe('src/Package.json');
    expect(result.results[1].key).toBe('lib/package.json');
  });

  it('searches by path', async () => {
    const bucket = createMockBucket([
      mockObject('src/components/Button.tsx'),
      mockObject('src/utils/helpers.ts'),
    ]);

    const result = await searchFiles(bucket, 'components');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].key).toBe('src/components/Button.tsx');
  });

  it('returns truncated=false when search is exhaustive', async () => {
    const bucket = createMockBucket([mockObject('readme.md')]);
    const result = await searchFiles(bucket, 'readme');
    expect(result.truncated).toBe(false);
  });
});
