import { useState, useRef, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
}

export function SearchBar({ onSearch, onClear, isSearching }: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (!newValue) {
        onClear();
        return;
      }

      if (newValue.length >= 2) {
        timerRef.current = setTimeout(() => {
          onSearch(newValue);
        }, 300);
      }
    },
    [onSearch, onClear]
  );

  const handleClear = useCallback(() => {
    setValue('');
    onClear();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [onClear]);

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
        {isSearching ? (
          <span className="inline-block animate-spin">&#8987;</span>
        ) : (
          '\uD83D\uDD0D'
        )}
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search files..."
        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          aria-label="Clear search"
        >
          &#10005;
        </button>
      )}
    </div>
  );
}
