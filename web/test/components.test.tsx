import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumbs } from '../src/components/Breadcrumbs';
import { FileList } from '../src/components/FileList';
import { SearchBar } from '../src/components/SearchBar';
import type { FileEntry } from '../src/types';

describe('Breadcrumbs', () => {
  it('renders root when path is empty', () => {
    render(<Breadcrumbs path="" onNavigate={() => {}} />);
    expect(screen.getByText('Vault')).toBeInTheDocument();
  });

  it('renders path segments', () => {
    render(<Breadcrumbs path="projects/webapp/" onNavigate={() => {}} />);
    expect(screen.getByText('Vault')).toBeInTheDocument();
    expect(screen.getByText('projects')).toBeInTheDocument();
    expect(screen.getByText('webapp')).toBeInTheDocument();
  });

  it('calls onNavigate when clicking a segment', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumbs path="projects/webapp/" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Vault'));
    expect(onNavigate).toHaveBeenCalledWith('');
  });

  it('calls onNavigate with correct path for intermediate segment', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumbs path="projects/webapp/src/" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('projects'));
    expect(onNavigate).toHaveBeenCalledWith('projects/');
  });
});

describe('FileList', () => {
  const entries: FileEntry[] = [
    { name: 'readme.md', key: 'readme.md', size: 500, lastModified: '2026-01-15T10:00:00Z', type: 'file' },
    { name: 'src', key: 'src/', size: 0, lastModified: '', type: 'directory' },
    { name: 'app.ts', key: 'app.ts', size: 200, lastModified: '2026-01-14T10:00:00Z', type: 'file' },
  ];

  it('renders all entries', () => {
    render(<FileList entries={entries} onNavigate={() => {}} onSelect={() => {}} selectedKey={null} />);
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('readme.md')).toBeInTheDocument();
    expect(screen.getByText('app.ts')).toBeInTheDocument();
  });

  it('shows directories before files', () => {
    const { container } = render(
      <FileList entries={entries} onNavigate={() => {}} onSelect={() => {}} selectedKey={null} />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveTextContent('src');
  });

  it('calls onNavigate for directory clicks', () => {
    const onNavigate = vi.fn();
    render(<FileList entries={entries} onNavigate={onNavigate} onSelect={() => {}} selectedKey={null} />);
    fireEvent.click(screen.getByText('src'));
    expect(onNavigate).toHaveBeenCalledWith('src/');
  });

  it('calls onSelect for file clicks', () => {
    const onSelect = vi.fn();
    render(<FileList entries={entries} onNavigate={() => {}} onSelect={onSelect} selectedKey={null} />);
    fireEvent.click(screen.getByText('readme.md'));
    expect(onSelect).toHaveBeenCalledWith(entries[0]);
  });

  it('shows empty directory message', () => {
    render(<FileList entries={[]} onNavigate={() => {}} onSelect={() => {}} selectedKey={null} />);
    expect(screen.getByText('Empty directory')).toBeInTheDocument();
  });
});

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar onSearch={() => {}} onClear={() => {}} isSearching={false} />);
    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
  });

  it('shows clear button when value is entered', () => {
    render(<SearchBar onSearch={() => {}} onClear={() => {}} isSearching={false} />);
    const input = screen.getByPlaceholderText('Search files...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<SearchBar onSearch={() => {}} onClear={onClear} isSearching={false} />);
    const input = screen.getByPlaceholderText('Search files...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(onClear).toHaveBeenCalled();
  });
});
