import { NextRequest, NextResponse } from 'next/server';
import {
  countRecentCommentsByIp,
  createComment,
  getComments,
  validateCreateCommentRequest,
} from '@/lib/artworkStore';
import { getClientIpHash } from '@/lib/clientIp';

// IP당 1분에 최대 5개
const COMMENT_RATE_LIMIT = 5;
const COMMENT_RATE_WINDOW_MS = 60_000;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/artworks/[id]/comments - 댓글 목록 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const result = await getComments(id);

    return NextResponse.json({
      comments: result.comments,
      total: result.total,
    });
  } catch (error) {
    console.error('Failed to get comments:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/artworks/[id]/comments - 댓글 작성
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!validateCreateCommentRequest(body)) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const ipHash = getClientIpHash(request);
    const recentCount = await countRecentCommentsByIp(ipHash, COMMENT_RATE_WINDOW_MS);
    if (recentCount >= COMMENT_RATE_LIMIT) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: '댓글을 너무 자주 작성했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429, headers: { 'Retry-After': String(COMMENT_RATE_WINDOW_MS / 1000) } }
      );
    }

    const comment = await createComment(id, body, ipHash);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
