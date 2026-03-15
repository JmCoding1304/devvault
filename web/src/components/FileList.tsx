import type { FileEntry } from '../types';
import { getFileIcon, formatFileSize, formatRelativeDate } from '../lib/fileUtils';
import { getDownloadUrl, getFolderDownloadUrl } from '../lib/api';

interface FileListProps {
  entries: FileEntry[];
  onNavigate: (path: string) => void;
  onSelect: (entry: FileEntry) => void;
  selectedKey: string | null;
}

export function FileList({ entries, onNavigate, onSelect, selectedKey }: FileListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Empty directory
      </div>
    );
  }

  // Sort: directories first (alphabetical), then files (alphabetical)
  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const handleDownload = (e: React.MouseEvent, entry: FileEntry) => {
    e.stopPropagation();
    const url = entry.type === 'directory'
      ? getFolderDownloadUrl(entry.key)
      : getDownloadUrl(entry.key);
    window.open(url, '_blank');
  };

  return (
    <div className="divide-y divide-gray-100">
      {sorted.map((entry) => {
        const isSelected = entry.key === selectedKey;
        const isDir = entry.type === 'directory';

        return (
          <div
            key={entry.key}
            className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50' : ''
            }`}
          >
            <button
              onClick={() => (isDir ? onNavigate(entry.key) : onSelect(entry))}
              className="flex-1 flex items-center gap-3 text-left min-w-0"
            >
              <span className="flex-shrink-0 w-5 text-center">{getFileIcon(entry)}</span>
              <span className={`flex-1 truncate ${isDir ? 'font-medium' : ''}`}>
                {entry.name}
              </span>
              <span className="flex-shrink-0 text-gray-400 text-xs w-16 text-right">
                {formatFileSize(entry.size)}
              </span>
              <span className="flex-shrink-0 text-gray-400 text-xs w-20 text-right hidden sm:block">
                {formatRelativeDate(entry.lastModified)}
              </span>
            </button>
            <button
              onClick={(e) => handleDownload(e, entry)}
              className="flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors p-1"
              title={isDir ? `Download ${entry.name} as zip` : `Download ${entry.name}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
