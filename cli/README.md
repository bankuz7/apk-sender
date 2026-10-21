# apk-sender CLI 📦

CLI version of **apk-sender** — upload any file (APK etc.) straight to Vercel Blob and get a public download link. No browser, no server, no Next.js app needed.

Uses the **same Blob store** as the web app, so your files live next to the ones uploaded from the website.

## Install

```bash
cd cli
npm install
npm link          # makes `apk-sender` available globally
```

## Setup (one time)

CLI needs your Blob store token (the same `BLOB_READ_WRITE_TOKEN` the web app uses):

```bash
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

**How to get the token:**

1. Vercel Dashboard → **Storage** → your Blob store
2. `.env.local` tab → copy `BLOB_READ_WRITE_TOKEN`

Tip: if you deploy this repo with `vercel`, run `vercel env pull .env` and `source .env` — the CLI also reads `.env` files in the current directory. *(Or just use the `--token` flag.)*

> ℹ️ Auto-loading from `.env` is supported: put `BLOB_READ_WRITE_TOKEN=...` in `.env` next to the CLI and run it normally.

## Usage

```bash
apk-sender myapp.apk
# Uploading myapp.apk (23 MB)
#   100%
# ✔ Uploaded
#   URL: https://xxxxx.public.blob.vercel-storage.com/uploads/myapp-abc123.apk

apk-sender myapp.apk --copy     # copy URL to clipboard
apk-sender myapp.apk --json     # full JSON response (pathname, size, etc.)
apk-sender myapp.apk --quiet    # print only the URL — pipe anywhere
apk-sender myapp.apk --name apps/latest.apk   # custom blob path (overwrites that path)
apk-sender myapp.apk --token vercel_blob_rw_xxx   # token via flag
```

**Scripting examples:**

```bash
latest=$(apk-sender app-release.apk --quiet)
echo "Download: $latest" | xdotool type   # or share via telegram/temail

# share build output
apk-sender dist/*.zip --quiet | pbcopy
```

## Notes

- Max upload size: **500 MB** (same limit as the web app)
- Every upload gets a random suffix unless you pass `--name`
- Works on Linux, macOS, Windows (Termux: needs `termux-clipboard-set` for `--copy`)
- Node ≥ 18

## How it's different from the web app

| | Web app | CLI |
|---|---|---|
| Needs deployment | Vercel | No — runs anywhere Node does |
| Token | In deployment env | Env var / `--token` |
| Upload path | Browser → Blob direct | Node → Blob direct |
