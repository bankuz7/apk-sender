import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'application/vnd.android.package-archive',
            'application/octet-stream',
          ],
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
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
