import { NextRequest, NextResponse } from 'next/server';
import { getArtworkPreview, getArtworkPreviewUrl } from '@/lib/artworkStore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/artworks/[id]/preview - 작품 미리보기 이미지 반환 (~900px, 상세 페이지용)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 새로운 URL 방식 확인
    const previewUrl = await getArtworkPreviewUrl(id);
    if (previewUrl) {
      // Supabase Storage URL로 리다이렉트
      return NextResponse.redirect(previewUrl, { status: 302 });
    }

    // 레거시 Base64 방식
    const imageData = await getArtworkPreview(id);
    if (!imageData) {
      return new NextResponse('Preview not found', { status: 404 });
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
    console.error('Failed to get artwork preview:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
