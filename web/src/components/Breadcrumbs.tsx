interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  const segments = path ? path.replace(/\/$/, '').split('/').filter(Boolean) : [];

  return (
    <nav className="flex items-center text-sm flex-wrap gap-1" aria-label="Breadcrumb">
      <button
        onClick={() => onNavigate('')}
        className={`hover:text-blue-600 ${segments.length === 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
      >
        Vault
      </button>
      {segments.map((segment, i) => {
        const segmentPath = segments.slice(0, i + 1).join('/') + '/';
        const isLast = i === segments.length - 1;

        return (
          <span key={segmentPath} className="flex items-center gap-1">
            <span className="text-gray-300">/</span>
            {isLast ? (
              <span className="text-gray-900 font-medium">{segment}</span>
            ) : (
              <button
                onClick={() => onNavigate(segmentPath)}
                className="text-gray-500 hover:text-blue-600"
              >
                {segment}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
