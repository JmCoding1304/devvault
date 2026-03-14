import type { FileEntry } from '../types';
import { getFileIcon, formatFileSize, formatRelativeDate } from '../lib/fileUtils';

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

  return (
    <div className="divide-y divide-gray-100">
      {sorted.map((entry) => {
        const isSelected = entry.key === selectedKey;
        const isDir = entry.type === 'directory';

        return (
          <button
            key={entry.key}
            onClick={() => (isDir ? onNavigate(entry.key) : onSelect(entry))}
            className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50' : ''
            }`}
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
        );
      })}
    </div>
  );
}
