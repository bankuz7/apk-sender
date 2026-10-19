import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate extension
    if (!file.name.toLowerCase().endsWith('.apk')) {
      return NextResponse.json(
        { error: 'Only .apk files are allowed' },
        { status: 400 }
      );
    }

    // Size limit 150MB
    if (file.size > 150 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 150MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const id = nanoid(12);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `apks/${id}-${safeName}`;

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: 'application/vnd.android.package-archive',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      name: file.name,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed. Make sure BLOB_READ_WRITE_TOKEN is set.' },
      { status: 500 }
    );
  }
}
