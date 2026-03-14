# DevVault Setup Guide

## Prerequisites

- Cloudflare account (free tier works)
- rclone installed (`brew install rclone`)
- Node.js 18+ and npm

---

## 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage** in the sidebar
3. Click **Create bucket**
4. Name: `devvault`
5. Location: choose closest region (or automatic)
6. Click **Create bucket**

## 2. Generate R2 API Token

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Name: `devvault-rclone`
4. Permissions: **Object Read & Write**
5. Scope: Apply to specific bucket → `devvault`
6. Click **Create API Token**
7. Copy the **Access Key ID** and **Secret Access Key** — you won't see these again
8. Note your **Account ID** from the R2 dashboard URL or overview page

## 3. Configure rclone

1. Copy the example config:
   ```bash
   cp rclone/rclone.conf.example ~/.config/rclone/rclone.conf
   ```
   Or merge with your existing config if you already have rclone remotes.

2. Edit `~/.config/rclone/rclone.conf` and replace placeholders:
   - `YOUR_R2_ACCESS_KEY_ID` → your Access Key ID
   - `YOUR_R2_SECRET_ACCESS_KEY` → your Secret Access Key
   - `YOUR_ACCOUNT_ID` → your Cloudflare Account ID

3. Verify the config:
   ```bash
   rclone lsd devvault:devvault
   ```
   Should return empty (no directories yet) without errors.

## 4. First Sync

1. **Dry run** first to see what would be synced:
   ```bash
   ./rclone/sync.sh --dry-run /path/to/your/drive
   ```

2. Review the output. Check that excluded directories (node_modules, .git, etc.) are not listed.

3. **Run the actual sync:**
   ```bash
   ./rclone/sync.sh /path/to/your/drive
   ```

4. Verify in Cloudflare R2 dashboard that files appear in the `devvault` bucket.

---

## 5. Deploy Worker API

1. Install dependencies:
   ```bash
   cd worker && npm install
   ```

2. Log in to Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. The Worker will be available at the configured route.

## 6. Deploy Frontend

1. Build the web app:
   ```bash
   cd web && npm install && npm run build
   ```

2. The Worker serves the built frontend from `web/dist/`. Redeploy the Worker after building:
   ```bash
   cd worker && npm run deploy
   ```

## 7. Set Up Custom Domain

1. In Cloudflare DNS for `joaomariano.dev`, add a CNAME record:
   - Name: `vault`
   - Target: your Worker's `*.workers.dev` subdomain
   - Proxy: enabled (orange cloud)

2. In Worker settings, add a Custom Domain: `vault.joaomariano.dev`

## 8. Configure Cloudflare Access

1. Go to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Application name: `DevVault`
4. Session duration: 24 hours
5. Application domain: `vault.joaomariano.dev`
6. Add a policy:
   - Name: `Email OTP`
   - Action: Allow
   - Include: Emails → your email address
7. Authentication: Email OTP (enabled by default)
8. Save

## 9. Verify Full Flow

1. Open `vault.joaomariano.dev` in a browser
2. You should see the Cloudflare Access login page
3. Enter your email, receive OTP, authenticate
4. The file browser should show your synced files
5. Navigate directories, preview files, download a file
6. Test on mobile browser for responsive layout
