import { NextRequest, NextResponse } from 'next/server';
import { getArtwork, deleteArtwork, likeArtwork } from '@/lib/artworkStore';
import { ApiErrorResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/artworks/[id] - 작품 상세 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const artwork = await getArtwork(id);

    if (!artwork) {
      const error: ApiErrorResponse = {
        error: 'NOT_FOUND',
        message: '작품을 찾을 수 없습니다.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Failed to get artwork:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: '작품을 불러오는데 실패했습니다.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/artworks/[id] - 작품 삭제
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteArtwork(id);

    if (!deleted) {
      const error: ApiErrorResponse = {
        error: 'NOT_FOUND',
        message: '작품을 찾을 수 없습니다.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete artwork:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: '작품 삭제에 실패했습니다.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/artworks/[id] - 좋아요
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'like') {
      const artwork = await likeArtwork(id);

      if (!artwork) {
        const error: ApiErrorResponse = {
          error: 'NOT_FOUND',
          message: '작품을 찾을 수 없습니다.',
        };
        return NextResponse.json(error, { status: 404 });
      }

      return NextResponse.json({ likes: artwork.likes });
    }

    const error: ApiErrorResponse = {
      error: 'BAD_REQUEST',
      message: '지원하지 않는 액션입니다.',
    };
    return NextResponse.json(error, { status: 400 });
  } catch (error) {
    console.error('Failed to process action:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: '요청 처리에 실패했습니다.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
