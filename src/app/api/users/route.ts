import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/authUtils';

// POST /api/users - 사용자 레코드 생성/업데이트 (로그인 후 호출)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { user, error: authError } = await requireAuth(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: authError || '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || 'Anonymous';
    const avatarUrl = user.user_metadata?.avatar_url;

    // upsert: 있으면 업데이트, 없으면 생성
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        nickname,
        avatarUrl,
      },
      create: {
        id: user.id,
        email: user.email!,
        nickname,
        avatarUrl,
      },
    });

    return NextResponse.json(dbUser, { status: 200 });
  } catch (error) {
    console.error('Failed to create/update user:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '사용자 정보 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
