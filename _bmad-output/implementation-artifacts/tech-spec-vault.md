---
title: 'DevVault — Personal Dev Cloud Backup & File Browser'
slug: 'vault'
created: '2026-03-14'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Cloudflare R2', 'rclone', 'Cloudflare Workers', 'Hono', 'React', 'Vite', 'Tailwind CSS', 'TypeScript', 'Cloudflare Pages', 'Cloudflare Access', 'Vitest']
files_to_modify: ['worker/src/index.ts', 'worker/src/routes/files.ts', 'worker/src/lib/r2.ts', 'worker/src/types.ts', 'worker/wrangler.toml', 'worker/package.json', 'worker/tsconfig.json', 'web/src/App.tsx', 'web/src/main.tsx', 'web/src/components/FileBrowser.tsx', 'web/src/components/Breadcrumbs.tsx', 'web/src/components/FileList.tsx', 'web/src/components/FilePreview.tsx', 'web/src/components/SearchBar.tsx', 'web/src/lib/api.ts', 'web/src/lib/fileUtils.ts', 'web/src/types.ts', 'web/package.json', 'web/tsconfig.json', 'web/index.html', 'web/tailwind.config.js', 'web/vite.config.ts', 'rclone/rclone.conf.example', 'rclone/sync.sh', 'rclone/exclude-filters.txt', 'docs/setup-guide.md']
code_patterns: ['Monorepo with worker/ and web/ packages', 'Hono for Worker routing', 'React functional components with hooks', 'TypeScript throughout', 'Tailwind CSS for styling', 'Wrangler CLI for deployment']
test_patterns: ['Vitest for both worker and web', 'Worker: unit tests for route handlers with mocked R2 bindings', 'Web: component tests with React Testing Library']
---

# Tech-Spec: DevVault — Personal Dev Cloud Backup & File Browser

**Created:** 2026-03-14

## Overview

### Problem Statement

Developers lack a tool that combines cloud backup of local drives with a web-based file browser. Existing backup tools (rclone, Restic) have no browsing UI; consumer cloud storage (Google Drive, Dropbox) chokes on dev file structures with deeply nested directories, symlinks, and thousands of small files. There is no developer-focused backup tool with a web-based file browsing experience.

### Solution

An rclone-to-Cloudflare-R2 backup pipeline paired with a Cloudflare Worker API and React file browser UI — giving incremental backup, directory browsing, file previews (code, markdown, images, PDF), and direct downloads from any device, secured behind Cloudflare Access with email OTP. Accessible at `vault.joaomariano.dev`.

### Scope

**In Scope:**
- rclone setup guide: R2 bucket creation, rclone config, smart exclude filters (node_modules, .git, __pycache__, etc.), first sync instructions
- Cloudflare Worker API: directory listing, file name/path search, presigned URL generation for downloads
- React file browser on Cloudflare Pages: breadcrumb navigation, syntax-highlighted code preview, markdown rendering, image preview, PDF preview, direct downloads, responsive design (desktop + mobile)
- Cloudflare Access setup: email OTP authentication, custom subdomain (vault.joaomariano.dev)
- Configurable for any mount point (not tied to a specific drive)

**Out of Scope:**
- Full-text content search (file name/path search only)
- Multi-user / team features
- Productization features (pricing, onboarding, multi-tenant)
- Automated/scheduled backups (manual rclone sync for v1)
- File upload/editing from the web UI
- Version history / snapshots
- Backup encryption (R2 handles encryption at rest)

## Context for Development

### Codebase Patterns

Greenfield project — confirmed clean slate. Patterns to establish:

- **Monorepo structure:** `worker/` (Cloudflare Worker API) and `web/` (React file browser) as separate packages, plus `rclone/` for sync config
- **Language:** TypeScript throughout (worker + web)
- **Worker API:** Hono framework on Cloudflare Workers — lightweight Express-like routing with native R2 bindings
- **Frontend:** React functional components with hooks, Vite for build tooling, Tailwind CSS for styling
- **Deployment:** Wrangler CLI for Worker + Pages deployment
- **R2 access:** Native Worker R2 bindings (no S3 SDK needed in the Worker)
- **Domain:** `vault.joaomariano.dev` — subdomain on existing `joaomariano.dev` domain

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `worker/src/index.ts` | Worker entry point, Hono app setup, route registration |
| `worker/src/routes/files.ts` | File listing, search, and download route handlers |
| `worker/src/lib/r2.ts` | R2 helpers — list objects, generate presigned URLs, get object for preview |
| `worker/src/types.ts` | Shared TypeScript types (FileEntry, DirectoryListing, SearchResult) |
| `worker/wrangler.toml` | Worker config — R2 bucket binding, custom domain, compatibility settings |
| `web/src/App.tsx` | Main app shell with layout |
| `web/src/components/FileBrowser.tsx` | Main file browser — orchestrates state, API calls, child components |
| `web/src/components/Breadcrumbs.tsx` | Clickable breadcrumb path navigation |
| `web/src/components/FileList.tsx` | Directory contents — folders first, then files, with icons/sizes/dates |
| `web/src/components/FilePreview.tsx` | Preview dispatcher — routes to correct renderer by file type |
| `web/src/components/SearchBar.tsx` | File name/path search with debounced input |
| `web/src/lib/api.ts` | API client — typed fetch wrappers for Worker endpoints |
| `web/src/lib/fileUtils.ts` | File type detection, size formatting, icon mapping |
| `web/src/types.ts` | Frontend TypeScript types (mirrors worker types) |
| `rclone/rclone.conf.example` | Example rclone config for R2 remote |
| `rclone/sync.sh` | Sync script with configurable mount point argument |
| `rclone/exclude-filters.txt` | Smart exclude filters for dev directories |
| `docs/setup-guide.md` | End-to-end setup: R2 bucket, rclone, Worker deploy, Pages deploy, Access config |

### Technical Decisions

- **Cloudflare R2** for storage: S3-compatible, zero egress fees, native Worker bindings
- **rclone** for sync: battle-tested, incremental, handles any file type
- **Cloudflare Workers + Hono** for API: native R2 bindings, no extra infra, generous free tier. User is new to Hono but comfortable learning it.
- **React + Vite + Tailwind CSS on Cloudflare Pages** for frontend: free hosting, same Cloudflare ecosystem, rapid UI development
- **Cloudflare Access with email OTP** for auth: zero-trust, no auth code to maintain, free tier (50 users)
- **Presigned URLs** for downloads: bypasses Worker response size limits (128MB), direct R2-to-client transfer
- **Subdomain approach** (`vault.joaomariano.dev`): cleaner for Access policies than path-based routing
- **Vitest** for testing: Vite-native, fast, works for both worker and web packages
- **~10GB initial data**: well within R2 free tier (10GB free)
- **R2 list with delimiter** for directory browsing: R2's `list()` with `delimiter: '/'` returns `delimitedPrefixes` (folders) and `objects` (files) at the current level — no need to fetch the entire bucket
- **Worker serves small files directly for preview** (code, markdown under ~1MB), presigned URLs for downloads and large files
- **CORS headers** on Worker responses: the Pages frontend (vault.joaomariano.dev) calls the Worker API (api-vault.joaomariano.dev or same domain with /api prefix). Using same-domain `/api` route prefix avoids CORS entirely — recommended approach.

## Implementation Plan

### Tasks

#### Phase 1: Infrastructure & Backup Pipeline

- [x] Task 1: Create R2 bucket and rclone config
  - File: `rclone/rclone.conf.example`
  - Action: Create example rclone config with R2 remote. Include placeholders for `access_key_id`, `secret_access_key`, `endpoint` (R2's S3-compatible endpoint). Set `provider = Cloudflare`.
  - Notes: User must create an R2 API token from Cloudflare dashboard with Object Read & Write permissions.

- [x] Task 2: Create exclude filters
  - File: `rclone/exclude-filters.txt`
  - Action: Create comprehensive exclude list for dev directories. Include: `node_modules/**`, `.git/**`, `__pycache__/**`, `*.pyc`, `.DS_Store`, `Thumbs.db`, `.env`, `.env.*`, `dist/**`, `build/**`, `.next/**`, `.nuxt/**`, `target/**` (Rust), `vendor/**` (Go), `.cache/**`, `*.log`, `.terraform/**`, `*.tfstate*`.
  - Notes: Use rclone filter syntax. One pattern per line. Comments with `#`.

- [x] Task 3: Create sync script
  - File: `rclone/sync.sh`
  - Action: Create a bash script that accepts a mount point path as argument, validates it exists, runs `rclone sync` with the exclude filter file, shows progress, and reports summary. Include `--dry-run` flag option for testing. Use `--transfers 8` for parallel uploads. Include `--checksum` flag for accurate change detection.
  - Notes: Script should be `chmod +x`. Print usage if no argument given. Trap errors and report clearly.

- [x] Task 4: Write setup guide — R2 and rclone sections
  - File: `docs/setup-guide.md`
  - Action: Write step-by-step instructions for: (1) Creating Cloudflare account / enabling R2, (2) Creating the `devvault` bucket, (3) Generating R2 API token, (4) Installing rclone (`brew install rclone`), (5) Configuring rclone with the example config, (6) Running first sync with `--dry-run`, (7) Running actual first sync. Include screenshots placeholder descriptions for Cloudflare dashboard steps.

#### Phase 2: Worker API

- [x] Task 5: Scaffold Worker project
  - Files: `worker/package.json`, `worker/tsconfig.json`, `worker/wrangler.toml`, `worker/src/index.ts`
  - Action: Initialize Worker project with `hono` dependency. Configure `wrangler.toml` with: R2 bucket binding (`VAULT_BUCKET`), compatibility date, custom route for `vault.joaomariano.dev/api/*`. Entry point: `src/index.ts`. Create Hono app in `index.ts` with CORS middleware (if needed) and route imports.
  - Notes: Use `wrangler.toml` format, not `wrangler.jsonc`. Bind R2 as `[[r2_buckets]] binding = "VAULT_BUCKET" bucket_name = "devvault"`.

- [x] Task 6: Define shared types
  - File: `worker/src/types.ts`
  - Action: Create TypeScript interfaces:
    ```typescript
    interface FileEntry {
      name: string;        // filename only
      key: string;         // full R2 key (path)
      size: number;        // bytes
      lastModified: string; // ISO date
      type: 'file' | 'directory';
      contentType?: string; // MIME type for files
    }
    interface DirectoryListing {
      path: string;          // current directory path
      entries: FileEntry[];  // files and folders
      truncated: boolean;    // if more results exist
      cursor?: string;       // pagination cursor
    }
    interface SearchResult {
      results: FileEntry[];
      query: string;
      truncated: boolean;
      cursor?: string;
    }
    ```
  - Notes: Export all interfaces. These will be mirrored in the web app.

- [x] Task 7: Implement R2 helper functions
  - File: `worker/src/lib/r2.ts`
  - Action: Create helper functions:
    - `listDirectory(bucket: R2Bucket, path: string, cursor?: string): Promise<DirectoryListing>` — Uses `bucket.list()` with `prefix` and `delimiter: '/'`. Transforms `delimitedPrefixes` into directory entries and `objects` into file entries. Handles pagination with 100 items per page.
    - `searchFiles(bucket: R2Bucket, query: string, cursor?: string): Promise<SearchResult>` — Lists all objects (paginated), filters by case-insensitive substring match on key. Returns matching entries.
    - `getPresignedUrl(bucket: R2Bucket, key: string): Promise<string>` — Note: R2 Workers binding doesn't support presigned URLs directly. Instead, create a `/api/download/:key` route that streams the object via `bucket.get()` with proper `Content-Disposition: attachment` header.
    - `getFileForPreview(bucket: R2Bucket, key: string): Promise<{body: ReadableStream, contentType: string, size: number}>` — Gets file for inline preview. Returns object body with detected content type.
  - Notes: R2 Worker bindings don't support presigned URLs. Use Worker as a proxy for downloads instead — this is fine for personal use with ~10GB. For large files, stream the response (don't buffer).

- [x] Task 8: Implement file routes
  - File: `worker/src/routes/files.ts`
  - Action: Create Hono route handlers:
    - `GET /api/files?path=<dir_path>&cursor=<cursor>` — Returns `DirectoryListing` JSON. Default path is root (`""`). Validates path doesn't contain `..`.
    - `GET /api/search?q=<query>&cursor=<cursor>` — Returns `SearchResult` JSON. Requires `q` param, minimum 2 characters.
    - `GET /api/download/*` — Streams file from R2 with `Content-Disposition: attachment; filename="<name>"`. Returns 404 if key not found.
    - `GET /api/preview/*` — Returns file content with appropriate `Content-Type` for inline viewing. Limit to files under 5MB. Returns 413 if too large (client should use download instead).
  - Notes: All routes access R2 via `c.env.VAULT_BUCKET`. Return proper HTTP status codes (200, 400, 404, 413). Include `Content-Type` headers.

- [x] Task 9: Wire up routes in Worker entry point
  - File: `worker/src/index.ts`
  - Action: Import Hono, create app instance. Mount file routes at `/api`. Add error handling middleware that returns JSON errors. Export default app. Type the Hono app with `Env` binding: `{ Bindings: { VAULT_BUCKET: R2Bucket } }`.
  - Notes: Keep this file minimal — just app setup and route mounting.

#### Phase 3: React File Browser UI

- [x] Task 10: Scaffold React project
  - Files: `web/package.json`, `web/tsconfig.json`, `web/vite.config.ts`, `web/index.html`, `web/tailwind.config.js`, `web/postcss.config.js`, `web/src/main.tsx`
  - Action: Initialize Vite + React + TypeScript project. Add dependencies: `react`, `react-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `react-syntax-highlighter`, `react-markdown`, `remark-gfm`, `@react-pdf-viewer/core` (or `react-pdf`). Configure Tailwind with content paths. Create `main.tsx` that renders `<App />`. Set up Vite proxy for `/api` to local Wrangler dev server during development (`vite.config.ts` proxy setting).
  - Notes: Use `@vitejs/plugin-react`. Proxy config: `server: { proxy: { '/api': 'http://localhost:8787' } }`.

- [x] Task 11: Create shared types and utilities
  - Files: `web/src/types.ts`, `web/src/lib/fileUtils.ts`, `web/src/lib/api.ts`
  - Action:
    - `types.ts`: Mirror `FileEntry`, `DirectoryListing`, `SearchResult` from worker types.
    - `fileUtils.ts`: Create helpers:
      - `getFileIcon(entry: FileEntry): string` — Returns emoji or icon class based on file extension. Folders get 📁, code files get 📄, images get 🖼️, etc.
      - `formatFileSize(bytes: number): string` — Human-readable sizes (1.2 KB, 3.4 MB, etc.)
      - `getFileType(name: string): 'code' | 'markdown' | 'image' | 'pdf' | 'text' | 'other'` — Determines preview strategy by extension.
      - `isPreviewable(name: string): boolean` — Returns true if file can be previewed inline.
    - `api.ts`: Typed API client:
      - `fetchDirectory(path: string, cursor?: string): Promise<DirectoryListing>`
      - `searchFiles(query: string, cursor?: string): Promise<SearchResult>`
      - `getDownloadUrl(key: string): string` — Returns `/api/download/<key>`
      - `getPreviewUrl(key: string): string` — Returns `/api/preview/<key>`
  - Notes: API client uses `fetch` with relative URLs (no base URL needed since same domain). Handle errors and throw typed errors.

- [x] Task 12: Build FileBrowser component (main container)
  - File: `web/src/components/FileBrowser.tsx`
  - Action: Create the main file browser component. Manages state:
    - `currentPath: string` — current directory path
    - `listing: DirectoryListing | null` — current directory contents
    - `selectedFile: FileEntry | null` — file selected for preview
    - `searchQuery: string` — current search input
    - `searchResults: SearchResult | null` — search results (when searching)
    - `loading: boolean` — loading state
    - `error: string | null` — error state
  - Behavior: On mount and path change, fetch directory listing. When search query changes (debounced 300ms), fetch search results. Render Breadcrumbs, SearchBar, FileList, and conditionally FilePreview.
  - Layout: Two-panel on desktop (file list left, preview right). Stacked on mobile (file list, then preview below). Use Tailwind responsive classes.
  - Notes: Use `useEffect` for data fetching, `useState` for state. Handle loading and error states with appropriate UI.

- [x] Task 13: Build Breadcrumbs component
  - File: `web/src/components/Breadcrumbs.tsx`
  - Action: Create breadcrumb navigation. Props: `path: string`, `onNavigate: (path: string) => void`. Split path by `/` to create clickable segments. Root is always first ("🏠 Vault"). Each segment is clickable, navigating to that directory. Current (last) segment is not clickable, shown in bold.
  - Notes: Style with Tailwind: `text-sm text-gray-500` for segments, `text-gray-900 font-medium` for current. Separator: `/` or `›`.

- [x] Task 14: Build FileList component
  - File: `web/src/components/FileList.tsx`
  - Action: Create file/folder listing. Props: `entries: FileEntry[]`, `onNavigate: (path: string) => void` (for folder clicks), `onSelect: (entry: FileEntry) => void` (for file clicks), `selectedKey: string | null`. Display as a table/list with columns: icon, name, size (blank for dirs), last modified. Sort: directories first (alphabetical), then files (alphabetical). Clicking a directory calls `onNavigate`. Clicking a file calls `onSelect`. Highlight selected file row. Show "Empty directory" message when no entries.
  - Notes: Use Tailwind for hover states (`hover:bg-gray-50`), selected state (`bg-blue-50`). Format dates as relative ("2 days ago") or short date. Use `fileUtils` for icons and size formatting.

- [x] Task 15: Build SearchBar component
  - File: `web/src/components/SearchBar.tsx`
  - Action: Create search input. Props: `onSearch: (query: string) => void`, `onClear: () => void`, `isSearching: boolean`. Debounce input by 300ms before calling `onSearch`. Show clear button (✕) when query is not empty. Show loading spinner when `isSearching` is true. Minimum 2 characters to trigger search.
  - Notes: Use `useRef` for debounce timer. Style: full-width input with search icon (🔍), rounded, border, focus ring.

- [x] Task 16: Build FilePreview component
  - File: `web/src/components/FilePreview.tsx`
  - Action: Create file preview panel. Props: `file: FileEntry`, `onClose: () => void`, `onDownload: (key: string) => void`. Determine preview type using `getFileType()`. Render appropriate preview:
    - **Code files** (`.js`, `.ts`, `.py`, `.go`, `.rs`, `.java`, `.css`, `.html`, `.json`, `.yaml`, `.toml`, `.sh`, `.sql`, etc.): Fetch content from `/api/preview/<key>`, display with `react-syntax-highlighter` using a dark theme (e.g., `oneDark`). Detect language from extension.
    - **Markdown** (`.md`, `.mdx`): Fetch content from `/api/preview/<key>`, render with `react-markdown` + `remark-gfm`. Style rendered HTML with Tailwind Typography plugin (`prose` class).
    - **Images** (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.ico`): Render `<img>` tag with `src="/api/preview/<key>"`. Contain within preview panel with `object-contain`.
    - **PDF** (`.pdf`): Use `react-pdf` or an `<iframe>` with `src="/api/preview/<key>"`. Fallback to download link if rendering fails.
    - **Other files**: Show file metadata (name, size, type, modified date) and a download button.
  - Header: Show file name, size, and close button (✕). Always show download button.
  - Notes: Preview panel should be scrollable. Show loading state while fetching content. Handle errors gracefully (show "Preview unavailable" + download button).

- [x] Task 17: Build App shell
  - File: `web/src/App.tsx`
  - Action: Create app shell. Render header with app name ("DevVault" or "Vault"), then `<FileBrowser />` as main content. Header is fixed/sticky. Minimal chrome — let the file browser take most of the viewport.
  - Notes: Style: dark header bar with white text, main content area with light gray background. Use `min-h-screen` and `flex flex-col`.

#### Phase 4: Deployment & Auth

- [x] Task 18: Configure Worker deployment
  - File: `worker/wrangler.toml`
  - Action: Finalize wrangler config: set `name = "devvault-api"`, add route `vault.joaomariano.dev/api/*` (or use Workers custom domain), bind R2 bucket. Add `[site]` or Pages config if serving frontend from the same Worker, OR deploy Pages separately and use `/api` route on the Worker.
  - Notes: Recommended approach: Deploy Worker with custom domain `vault.joaomariano.dev`. Worker serves both API routes (`/api/*`) and static assets (the React build). This avoids CORS and simplifies deployment. Use Hono's `serveStatic` from `hono/cloudflare-workers` or configure Worker Sites with `[site] bucket = "../web/dist"`.

- [x] Task 19: Configure Pages deployment (if separate) or Worker static serving
  - Files: `worker/src/index.ts` (update), `web/vite.config.ts` (update)
  - Action: Option A (recommended — single Worker): Configure Worker to serve static files from `web/dist` for non-API routes. Add `app.get('*', serveStatic({ root: './' }))` as catch-all after API routes. Update `wrangler.toml` to include `[site] bucket = "../web/dist"`. OR Option B: Deploy `web/` as Cloudflare Pages project with custom domain `vault.joaomariano.dev` and proxy `/api/*` to the Worker.
  - Notes: Option A is simpler for personal use — single deployment, single domain, no CORS. Build step: `cd web && npm run build`, then `cd worker && wrangler deploy`.

- [x] Task 20: Write setup guide — Worker, deployment, and Access sections
  - File: `docs/setup-guide.md` (update)
  - Action: Add sections for: (1) Deploying the Worker with `wrangler deploy`, (2) Setting up custom domain `vault.joaomariano.dev` in Cloudflare DNS, (3) Configuring Cloudflare Access: create Access application for `vault.joaomariano.dev`, add email OTP policy with user's email whitelisted, (4) Testing the full flow: sync files → browse → preview → download. Include verification steps at each stage.

### Acceptance Criteria

#### Backup Pipeline
- [x] AC 1: Given rclone is configured with R2 credentials, when `./rclone/sync.sh /path/to/drive` is run, then files are synced to R2 bucket incrementally (only changes uploaded).
- [x] AC 2: Given the exclude filter file exists, when sync runs, then `node_modules`, `.git`, `__pycache__`, and other dev artifacts are excluded.
- [x] AC 3: Given sync.sh is run without arguments, then it prints usage instructions and exits with error code.
- [x] AC 4: Given sync.sh is run with `--dry-run`, then it shows what would be synced without uploading anything.

#### Worker API
- [x] AC 5: Given files exist in R2, when `GET /api/files` is called with no path, then it returns a DirectoryListing of the root directory with folders and files.
- [x] AC 6: Given files exist in R2 at path `projects/webapp/`, when `GET /api/files?path=projects/webapp/` is called, then it returns only entries within that directory (not recursive).
- [x] AC 7: Given files exist in R2, when `GET /api/search?q=package.json` is called, then it returns all files whose name or path contains "package.json" (case-insensitive).
- [x] AC 8: Given a file exists in R2, when `GET /api/download/path/to/file.zip` is called, then the file is streamed with `Content-Disposition: attachment` header.
- [x] AC 9: Given a code file under 5MB exists in R2, when `GET /api/preview/path/to/file.ts` is called, then the file content is returned with appropriate Content-Type.
- [x] AC 10: Given a file over 5MB, when `GET /api/preview/path/to/large.bin` is called, then a 413 status is returned.
- [x] AC 11: Given a path with `..` segments, when any API endpoint is called, then it returns 400 Bad Request.

#### File Browser UI
- [x] AC 12: Given the app loads, when the user visits `vault.joaomariano.dev`, then they see the root directory listing with folders and files.
- [x] AC 13: Given a directory listing is shown, when the user clicks a folder, then the view navigates into that folder and breadcrumbs update.
- [x] AC 14: Given the user is in a nested directory, when they click a breadcrumb segment, then they navigate to that directory level.
- [x] AC 15: Given a directory listing is shown, when the user clicks a `.ts` file, then the file content is displayed with syntax highlighting in the preview panel.
- [x] AC 16: Given a directory listing is shown, when the user clicks a `.md` file, then the rendered markdown is displayed in the preview panel.
- [x] AC 17: Given a directory listing is shown, when the user clicks a `.png` file, then the image is displayed in the preview panel.
- [x] AC 18: Given a directory listing is shown, when the user clicks a `.pdf` file, then the PDF is rendered in the preview panel (or download link if rendering fails).
- [x] AC 19: Given a file is selected, when the user clicks "Download", then the file downloads via the browser with the correct filename.
- [x] AC 20: Given the user types "config" in the search bar, when 300ms pass without further typing, then search results show all files with "config" in their name or path.
- [x] AC 21: Given the user is on a mobile device, when they view the file browser, then the layout stacks vertically (list above, preview below) and is usable.

#### Auth & Security
- [x] AC 22: Given Cloudflare Access is configured, when an unauthenticated user visits `vault.joaomariano.dev`, then they are prompted for email OTP before seeing any content.
- [x] AC 23: Given a valid OTP is entered, when the user authenticates, then they can access the file browser normally.

## Additional Context

### Dependencies

**External services (to be created/configured):**
- Cloudflare account with R2 enabled
- R2 bucket named `devvault`
- R2 API token with Object Read & Write permissions
- Cloudflare Access application for `vault.joaomariano.dev`
- DNS CNAME record for `vault.joaomariano.dev` → Worker custom domain
- rclone installed locally (`brew install rclone`)

**NPM packages — Worker:**
- `hono` — routing framework
- `wrangler` — Cloudflare CLI (dev dependency)
- `vitest` — test runner (dev dependency)
- `@cloudflare/workers-types` — R2 type definitions (dev dependency)

**NPM packages — Web:**
- `react`, `react-dom` — UI framework
- `react-syntax-highlighter` + `@types/react-syntax-highlighter` — code preview
- `react-markdown` + `remark-gfm` — markdown rendering
- `react-pdf` + `pdfjs-dist` — PDF preview
- `tailwindcss`, `postcss`, `autoprefixer` — styling
- `@tailwindcss/typography` — prose styling for markdown
- `vitest`, `@testing-library/react`, `jsdom` — testing (dev dependencies)

### Testing Strategy

**Worker tests (Vitest):**
- Unit test each route handler with mocked R2 bucket binding
- Test directory listing returns correct structure for given R2 objects
- Test search filtering logic
- Test path validation (reject `..` traversal)
- Test 404 for missing files, 413 for oversized preview

**Web tests (Vitest + React Testing Library):**
- Component tests for FileList: renders entries, sorts correctly, handles clicks
- Component tests for Breadcrumbs: renders path segments, click navigation works
- Component tests for SearchBar: debounce works, clear works
- Component tests for FilePreview: renders correct preview type per file extension
- Integration test for FileBrowser: mock API, verify navigation flow

**Manual testing:**
- Sync a sample directory to R2
- Browse directories, verify listing accuracy matches R2 contents
- Preview each file type (code, markdown, image, PDF)
- Download a file and verify integrity
- Test on mobile browser
- Test Cloudflare Access blocks unauthenticated users

### Notes

- **Risk: R2 list performance at scale.** With 10GB / thousands of files, `bucket.list()` performs well. If the user later backs up 100GB+ with millions of files, search (which iterates all objects) may need optimization (e.g., caching file index in KV). Not a concern for v1.
- **Risk: PDF preview complexity.** `react-pdf` requires `pdfjs-dist` worker setup. If it proves too complex, fall back to `<iframe>` rendering or download-only for PDFs.
- **Risk: Large file preview.** The 5MB preview limit protects the Worker, but some code files could be large (e.g., minified bundles). The UI should gracefully handle the 413 response and offer download instead.
- **Future consideration:** When productizing, add `rclone crypt` for client-side encryption, scheduled sync via cron/launchd, and a proper auth system for multi-user.
- User owns `joaomariano.dev` domain.
- Personal use first, potential productization later.
- Initial backup size ~10GB (R2 free tier).
- User is new to Hono — keep Worker code patterns simple and well-commented.

## Review Notes
- Adversarial review completed: 17 findings (2 Critical, 4 High, 6 Medium, 4 Low)
- Findings: 16 fixed, 1 skipped (F10: CORS — already handled by Vite proxy)
- Resolution approach: auto-fix
- Key fixes: CF Access JWT auth middleware, rclone copy instead of sync, path sanitization, Content-Disposition RFC 5987, CSP sandbox on previews, search scan cap, head() before get() for preview size, rehype-sanitize for markdown, expanded secret exclusions
