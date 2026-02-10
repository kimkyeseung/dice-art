import { NextRequest, NextResponse } from 'next/server';
import { createComment, getComments, validateCreateCommentRequest } from '@/lib/artworkStore';
import { requireAuth } from '@/lib/authUtils';

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

// POST /api/artworks/[id]/comments - 댓글 작성 (인증 필요)
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 인증 확인
    const { user, error: authError } = await requireAuth(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: authError || '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    if (!validateCreateCommentRequest(body)) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    // userId 추가 및 닉네임 설정
    const commentData = {
      ...body,
      userId: user.id,
      authorName: user.user_metadata?.nickname || body.authorName,
    };

    const comment = await createComment(id, commentData);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
