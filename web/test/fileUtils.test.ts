import { describe, it, expect } from 'vitest';
import {
  getFileIcon,
  formatFileSize,
  getFileType,
  isPreviewable,
  getLanguage,
  formatRelativeDate,
} from '../src/lib/fileUtils';

describe('getFileIcon', () => {
  it('returns folder icon for directories', () => {
    expect(getFileIcon({ name: 'src', type: 'directory' })).toBe('\uD83D\uDCC1');
  });

  it('returns code icon for .ts files', () => {
    expect(getFileIcon({ name: 'index.ts', type: 'file' })).toBe('\uD83D\uDCC4');
  });

  it('returns image icon for .png files', () => {
    expect(getFileIcon({ name: 'logo.png', type: 'file' })).toBe('\uD83D\uDDBC\uFE0F');
  });
});

describe('formatFileSize', () => {
  it('returns empty string for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3 MB');
  });
});

describe('getFileType', () => {
  it('detects code files', () => {
    expect(getFileType('index.ts')).toBe('code');
    expect(getFileType('app.py')).toBe('code');
    expect(getFileType('style.css')).toBe('code');
  });

  it('detects markdown', () => {
    expect(getFileType('README.md')).toBe('markdown');
    expect(getFileType('doc.mdx')).toBe('markdown');
  });

  it('detects images', () => {
    expect(getFileType('logo.png')).toBe('image');
    expect(getFileType('photo.jpg')).toBe('image');
  });

  it('detects PDF', () => {
    expect(getFileType('doc.pdf')).toBe('pdf');
  });

  it('detects text', () => {
    expect(getFileType('notes.txt')).toBe('text');
  });

  it('returns other for unknown extensions', () => {
    expect(getFileType('data.bin')).toBe('other');
  });
});

describe('isPreviewable', () => {
  it('returns true for previewable files', () => {
    expect(isPreviewable('index.ts')).toBe(true);
    expect(isPreviewable('README.md')).toBe(true);
    expect(isPreviewable('logo.png')).toBe(true);
  });

  it('returns false for non-previewable files', () => {
    expect(isPreviewable('data.bin')).toBe(false);
  });
});

describe('getLanguage', () => {
  it('maps extensions to language identifiers', () => {
    expect(getLanguage('app.tsx')).toBe('tsx');
    expect(getLanguage('main.py')).toBe('python');
    expect(getLanguage('config.yaml')).toBe('yaml');
  });

  it('returns text for unknown extensions', () => {
    expect(getLanguage('unknown.xyz')).toBe('text');
  });
});

describe('formatFileSize edge cases', () => {
  it('returns empty for negative numbers', () => {
    expect(formatFileSize(-1)).toBe('');
  });

  it('handles terabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024 * 1024)).toBe('2 TB');
  });
});

describe('formatRelativeDate', () => {
  it('returns empty for empty string', () => {
    expect(formatRelativeDate('')).toBe('');
  });

  it('returns empty for invalid date', () => {
    expect(formatRelativeDate('not-a-date')).toBe('');
  });

  it('returns "today" for today', () => {
    expect(formatRelativeDate(new Date().toISOString())).toBe('today');
  });

  it('returns "yesterday" for yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(yesterday.toISOString())).toBe('yesterday');
  });

  it('returns days ago for recent dates', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(fiveDaysAgo.toISOString())).toBe('5d ago');
  });

  it('returns "upcoming" for future dates', () => {
    const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(formatRelativeDate(tomorrow.toISOString())).toBe('upcoming');
  });
});
