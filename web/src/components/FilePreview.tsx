import { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { FileEntry } from '../types';
import { getFileType, formatFileSize, getLanguage } from '../lib/fileUtils';
import { getDownloadUrl, getPreviewUrl } from '../lib/api';

interface FilePreviewProps {
  file: FileEntry;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileType = getFileType(file.name);

  // Fetch text content for code/markdown/text files
  useEffect(() => {
    if (fileType !== 'code' && fileType !== 'markdown' && fileType !== 'text') {
      setContent(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(getPreviewUrl(file.key))
      .then((res) => {
        if (res.status === 413) throw new Error('File too large for preview');
        if (!res.ok) throw new Error('Preview unavailable');
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file.key, fileType]);

  const handleDownload = () => {
    window.open(getDownloadUrl(file.key), '_blank');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b flex-shrink-0">
        <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
        <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
        <button
          onClick={handleDownload}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Download
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Close preview"
        >
          &#10005;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Loading preview...
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-gray-400 text-sm">{error}</span>
            <button
              onClick={handleDownload}
              className="text-sm text-blue-500 hover:underline"
            >
              Download instead
            </button>
          </div>
        )}

        {!loading && !error && fileType === 'code' && content !== null && (
          <SyntaxHighlighter
            language={getLanguage(file.name)}
            style={atomOneDark}
            customStyle={{ margin: 0, fontSize: '13px', minHeight: '100%' }}
            showLineNumbers
          >
            {content}
          </SyntaxHighlighter>
        )}

        {!loading && !error && fileType === 'markdown' && content !== null && (
          <div className="prose prose-sm max-w-none p-4">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{content}</Markdown>
          </div>
        )}

        {!loading && !error && fileType === 'text' && content !== null && (
          <pre className="p-4 text-sm font-mono text-gray-700 whitespace-pre-wrap">
            {content}
          </pre>
        )}

        {!loading && !error && fileType === 'image' && (
          <div className="flex items-center justify-center p-4">
            <img
              src={getPreviewUrl(file.key)}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        )}

        {!loading && !error && fileType === 'pdf' && (
          <iframe
            src={getPreviewUrl(file.key)}
            className="w-full h-full min-h-[500px]"
            title={file.name}
          />
        )}

        {!loading && !error && fileType === 'other' && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-gray-400 text-sm">
              No preview available for this file type
            </span>
            <button
              onClick={handleDownload}
              className="text-sm text-blue-500 hover:underline"
            >
              Download file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
