#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE="devvault:devvault"
FILTER_FILE="$SCRIPT_DIR/exclude-filters.txt"

usage() {
  echo "Usage: $0 [--dry-run] [--sync] <mount-point-path>"
  echo ""
  echo "Back up a local directory to Cloudflare R2 via rclone."
  echo ""
  echo "By default, uses 'rclone copy' (add/update only, never deletes remote files)."
  echo ""
  echo "Arguments:"
  echo "  <mount-point-path>  Path to the directory to back up"
  echo ""
  echo "Options:"
  echo "  --dry-run    Show what would change without uploading"
  echo "  --sync       Use mirror mode (deletes remote files not in source, with --max-delete 50 safety)"
  echo ""
  echo "Examples:"
  echo "  $0 /Volumes/mydata"
  echo "  $0 --dry-run /Volumes/mydata"
  echo "  $0 --sync --dry-run /Volumes/mydata"
  exit 1
}

EXTRA_FLAGS=()
SOURCE=""
USE_SYNC=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      EXTRA_FLAGS+=(--dry-run)
      shift
      ;;
    --sync)
      USE_SYNC=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      SOURCE="$1"
      shift
      ;;
  esac
done

if [[ -z "$SOURCE" ]]; then
  echo "Error: No mount point path provided."
  echo ""
  usage
fi

if [[ ! -d "$SOURCE" ]]; then
  echo "Error: '$SOURCE' is not a valid directory."
  exit 1
fi

if [[ ! -f "$FILTER_FILE" ]]; then
  echo "Error: Exclude filter file not found at $FILTER_FILE"
  exit 1
fi

if ! command -v rclone &>/dev/null; then
  echo "Error: rclone is not installed. Install with: brew install rclone"
  exit 1
fi

RCLONE_CMD="copy"
if [[ "$USE_SYNC" == true ]]; then
  RCLONE_CMD="sync"
  EXTRA_FLAGS+=(--max-delete 50)
fi

echo "=== DevVault Backup ==="
echo "Source:  $SOURCE"
echo "Remote:  $REMOTE"
echo "Mode:    $RCLONE_CMD${EXTRA_FLAGS[*]:+ (${EXTRA_FLAGS[*]})}"
echo ""

trap 'echo ""; echo "Backup interrupted."; exit 1' INT TERM

rclone "$RCLONE_CMD" \
  "$SOURCE" \
  "$REMOTE" \
  --exclude-from "$FILTER_FILE" \
  --transfers 8 \
  --checksum \
  --progress \
  --stats-one-line \
  ${EXTRA_FLAGS[@]+"${EXTRA_FLAGS[@]}"} \
  -v

echo ""
echo "=== Backup complete ==="
