# APK Sender 📦

Web based APK uploader & sharer.

Upload any APK → Get a public download link → Share with anyone.

## Features

- Drag & drop or click to upload APK
- Max 150MB support
- Instant public download link (Vercel Blob)
- No login required
- Clean dark UI
- Mobile friendly

## Deploy on Vercel (Recommended)

1. Fork / clone this repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import this repo
3. **Important**: Add Environment Variable

   - Name: `BLOB_READ_WRITE_TOKEN`
   - Value: Create one from Vercel Dashboard → Storage → Create Blob Store → Connect to project → it will give you the token

   Or go to: Project Settings → Environment Variables → Add `BLOB_READ_WRITE_TOKEN`

4. Deploy!

### How to get BLOB_READ_WRITE_TOKEN

1. Vercel Dashboard → Storage tab → Create Database / Blob
2. Choose **Blob**
3. Create store → Connect it to your project
4. It automatically adds `BLOB_READ_WRITE_TOKEN` to the project

## Local Development

```bash
npm install

# Create .env.local and add:
# BLOB_READ_WRITE_TOKEN=your_token_here

npm run dev
```

Open http://localhost:3000

## How it works

1. User selects an APK file
2. File is uploaded to Vercel Blob (public)
3. A permanent public URL is generated
4. Anyone with the link can download the APK directly

## Tech Stack

- Next.js 14 (App Router)
- Vercel Blob for storage
- TypeScript
- Edge Runtime for fast uploads

---

Made for easy APK sharing.
