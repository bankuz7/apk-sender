import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Restrict to APK files only + size limit
        return {
          allowedContentTypes: [
            'application/vnd.android.package-archive',
            'application/octet-stream', // some browsers send this for .apk
          ],
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ type: 'apk' }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Optional: you can log or store the URL somewhere
        console.log('APK uploaded:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Upload token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload token' },
      { status: 400 }
    );
  }
}
