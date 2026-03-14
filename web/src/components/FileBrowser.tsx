import { useState, useEffect, useCallback } from 'react';
import type { FileEntry, DirectoryListing, SearchResult } from '../types';
import { fetchDirectory, searchFiles } from '../lib/api';
import { Breadcrumbs } from './Breadcrumbs';
import { FileList } from './FileList';
import { FilePreview } from './FilePreview';
import { SearchBar } from './SearchBar';

export function FileBrowser() {
  const [currentPath, setCurrentPath] = useState('');
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch directory listing
  useEffect(() => {
    if (searchQuery) return; // Don't fetch directory while searching

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDirectory(currentPath)
      .then((data) => {
        if (!cancelled) {
          setListing(data);
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
  }, [currentPath, searchQuery]);

  const handleNavigate = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  const handleSelect = useCallback((entry: FileEntry) => {
    setSelectedFile(entry);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await searchFiles(query);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const entries = searchResults ? searchResults.results : listing?.entries || [];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar */}
      <div className="bg-white border-b px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2">
        <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />
        <div className="sm:ml-auto sm:w-72">
          <SearchBar
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isSearching={loading && !!searchQuery}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* File list */}
        <div className={`${selectedFile ? 'lg:w-1/2 lg:border-r' : 'w-full'} overflow-auto`}>
          {loading && !entries.length ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Loading...
            </div>
          ) : (
            <FileList
              entries={entries}
              onNavigate={handleNavigate}
              onSelect={handleSelect}
              selectedKey={selectedFile?.key || null}
            />
          )}
        </div>

        {/* Preview panel */}
        {selectedFile && (
          <div className="lg:w-1/2 overflow-auto border-t lg:border-t-0">
            <FilePreview
              file={selectedFile}
              onClose={handleClosePreview}
            />
          </div>
        )}
      </div>
    </div>
  );
}
