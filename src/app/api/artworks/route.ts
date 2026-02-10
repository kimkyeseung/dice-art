import { NextRequest, NextResponse } from 'next/server';
import {
  createArtwork,
  getArtworks,
  validateCreateArtworkRequest,
} from '@/lib/artworkStore';
import { requireAuth } from '@/lib/authUtils';
import { ArtworkListResponse, ApiErrorResponse } from '@/types';

// POST /api/artworks - 작품 업로드 (인증 필요)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { user, error: authError } = await requireAuth(request);

    if (authError || !user) {
      const error: ApiErrorResponse = {
        error: 'UNAUTHORIZED',
        message: authError || '로그인이 필요합니다.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();

    // 유효성 검사
    if (!validateCreateArtworkRequest(body)) {
      const error: ApiErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다. title, authorName, gridState, imageUrl, thumbnailUrl, previewUrl이 필요합니다.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // 제목 길이 검사
    if (body.title.length > 100) {
      const error: ApiErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: '제목은 100자를 초과할 수 없습니다.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // 작성자 이름 길이 검사
    if (body.authorName.length > 50) {
      const error: ApiErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: '작성자 이름은 50자를 초과할 수 없습니다.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // userId 추가 (인증된 사용자)
    const artworkData = {
      ...body,
      userId: user.id,
      // authorName은 닉네임으로 설정 (user_metadata에서 가져오기)
      authorName: user.user_metadata?.nickname || body.authorName,
    };

    const artwork = await createArtwork(artworkData);

    return NextResponse.json(artwork, { status: 201 });
  } catch (error) {
    console.error('Failed to create artwork:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: '작품 저장에 실패했습니다.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET /api/artworks - 작품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const author = searchParams.get('author') || undefined;

    const result = await getArtworks(page, limit, author);

    const response: ArtworkListResponse = {
      artworks: result.artworks,
      total: result.total,
      page,
      limit,
      hasMore: result.hasMore,
    };

    // 캐싱 헤더 추가 (1분 캐시, 5분 stale-while-revalidate)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to get artworks:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: '작품 목록을 불러오는데 실패했습니다.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
