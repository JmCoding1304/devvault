import { FileBrowser } from './components/FileBrowser';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white px-4 py-3 flex-shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">DevVault</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <FileBrowser />
      </main>
    </div>
  );
}
