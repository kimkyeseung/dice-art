import { NextRequest, NextResponse } from 'next/server';
import { getArtworkImage } from '@/lib/artworkStore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/artworks/[id]/image - 작품 이미지 반환
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const imageData = await getArtworkImage(id);

    if (!imageData) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // base64 데이터에서 실제 이미지 바이너리 추출
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 이미지 타입 감지
    let contentType = 'image/png';
    if (imageData.startsWith('data:image/jpeg')) {
      contentType = 'image/jpeg';
    } else if (imageData.startsWith('data:image/webp')) {
      contentType = 'image/webp';
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to get artwork image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
