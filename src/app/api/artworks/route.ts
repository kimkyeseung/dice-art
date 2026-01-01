import { NextRequest, NextResponse } from 'next/server';
import {
  createArtwork,
  getArtworks,
  validateCreateArtworkRequest,
} from '@/lib/artworkStore';
import { ArtworkListResponse, ApiErrorResponse } from '@/types';

// POST /api/artworks - 작품 업로드
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 유효성 검사
    if (!validateCreateArtworkRequest(body)) {
      const error: ApiErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다. title, authorName, gridState, imageData가 필요합니다.',
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

    // 이미지 크기 검사 (약 10MB)
    if (body.imageData.length > 10 * 1024 * 1024) {
      const error: ApiErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: '이미지 크기가 너무 큽니다. (최대 10MB)',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const artwork = await createArtwork(body);

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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get artworks:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: '작품 목록을 불러오는데 실패했습니다.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
