import { NextRequest, NextResponse } from 'next/server';
import { getArtworkThumbnail, getArtworkThumbnailUrl } from '@/lib/artworkStore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/artworks/[id]/thumbnail - 작품 썸네일 반환 (~150px, 갤러리 목록용)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 새로운 URL 방식 확인
    const thumbnailUrl = await getArtworkThumbnailUrl(id);
    if (thumbnailUrl) {
      // Supabase Storage URL로 리다이렉트
      return NextResponse.redirect(thumbnailUrl, { status: 302 });
    }

    // 레거시 Base64 방식
    const imageData = await getArtworkThumbnail(id);
    if (!imageData) {
      return new NextResponse('Thumbnail not found', { status: 404 });
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
    console.error('Failed to get artwork thumbnail:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
