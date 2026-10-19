# APK Sender 📦

Web based APK uploader & sharer.

Upload any APK → Get a public download link → Share with anyone.

## Features

- Drag & drop or click to upload APK
- Supports large files (up to 200MB+)
- Instant public download link (Vercel Blob)
- Real upload progress
- No login required
- Clean dark UI
- Mobile friendly

## Deploy on Vercel

1. Import this repo on [vercel.com](https://vercel.com)
2. **Important**: Create a **Blob** store

   - Go to **Storage** tab → Create → **Blob**
   - Connect the store to your project
   - This automatically adds `BLOB_READ_WRITE_TOKEN`

3. Deploy!

### How to get BLOB_READ_WRITE_TOKEN

1. Vercel Dashboard → **Storage** → Create Database/Blob
2. Choose **Blob** → Create store
3. Connect it to your project
4. Token is added automatically

## Local Development

```bash
npm install
vercel env pull   # pulls BLOB_READ_WRITE_TOKEN
npm run dev
```

## How it works

Uses **client-side upload** so large APKs (95MB+) work without hitting Vercel's 4.5MB body limit.

1. Browser requests a short-lived upload token from `/api/upload`
2. File is uploaded **directly** from browser → Vercel Blob
3. You get a permanent public URL to share

## Tech Stack

- Next.js 14 (App Router)
- Vercel Blob (client uploads)
- TypeScript

---

Made for easy APK sharing.
