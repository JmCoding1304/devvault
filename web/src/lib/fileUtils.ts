const ICON_MAP: Record<string, string> = {
  // Folders
  directory: '\uD83D\uDCC1',
  // Code
  ts: '\uD83D\uDCC4', tsx: '\uD83D\uDCC4', js: '\uD83D\uDCC4', jsx: '\uD83D\uDCC4',
  py: '\uD83D\uDCC4', go: '\uD83D\uDCC4', rs: '\uD83D\uDCC4', java: '\uD83D\uDCC4',
  c: '\uD83D\uDCC4', cpp: '\uD83D\uDCC4', h: '\uD83D\uDCC4',
  css: '\uD83C\uDFA8', html: '\uD83C\uDF10', json: '\uD83D\uDCC4',
  yaml: '\uD83D\uDCC4', yml: '\uD83D\uDCC4', toml: '\uD83D\uDCC4',
  sh: '\uD83D\uDCC4', bash: '\uD83D\uDCC4', sql: '\uD83D\uDCC4',
  xml: '\uD83D\uDCC4',
  // Markdown
  md: '\uD83D\uDCDD', mdx: '\uD83D\uDCDD',
  // Images
  png: '\uD83D\uDDBC\uFE0F', jpg: '\uD83D\uDDBC\uFE0F', jpeg: '\uD83D\uDDBC\uFE0F',
  gif: '\uD83D\uDDBC\uFE0F', svg: '\uD83D\uDDBC\uFE0F', webp: '\uD83D\uDDBC\uFE0F', ico: '\uD83D\uDDBC\uFE0F',
  // PDF
  pdf: '\uD83D\uDCC3',
  // Text
  txt: '\uD83D\uDCC4', log: '\uD83D\uDCC4',
};

export function getFileIcon(entry: { name: string; type: string }): string {
  if (entry.type === 'directory') return '\uD83D\uDCC1';
  const ext = entry.name.split('.').pop()?.toLowerCase() || '';
  return ICON_MAP[ext] || '\uD83D\uDCC4';
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  if (size % 1 === 0) return `${size} ${units[i]}`;
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[i]}`;
}

const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'h',
  'css', 'html', 'json', 'yaml', 'yml', 'toml', 'sh', 'bash', 'sql',
  'xml', 'graphql', 'prisma', 'dockerfile', 'makefile', 'rb', 'php',
  'swift', 'kt', 'scala', 'lua', 'r', 'vue', 'svelte',
]);

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp']);

export function getFileType(name: string): 'code' | 'markdown' | 'image' | 'pdf' | 'text' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'md' || ext === 'mdx') return 'markdown';
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (CODE_EXTENSIONS.has(ext)) return 'code';
  if (ext === 'txt' || ext === 'log' || ext === 'csv') return 'text';
  return 'other';
}

export function isPreviewable(name: string): boolean {
  const type = getFileType(name);
  return type !== 'other';
}

export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'upcoming';
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// Map file extensions to syntax highlighter language identifiers
export function getLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    py: 'python', go: 'go', rs: 'rust', java: 'java',
    c: 'c', cpp: 'cpp', h: 'c', css: 'css', html: 'html',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    sh: 'bash', bash: 'bash', sql: 'sql', xml: 'xml',
    graphql: 'graphql', rb: 'ruby', php: 'php',
    swift: 'swift', kt: 'kotlin', scala: 'scala', lua: 'lua',
    r: 'r', vue: 'html', svelte: 'html',
  };
  return map[ext] || 'text';
}
