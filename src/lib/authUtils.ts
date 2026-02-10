import { NextRequest } from 'next/server';
import { User } from '@supabase/supabase-js';
import { getUserFromToken, extractBearerToken } from './supabaseServer';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

/**
 * API 라우트에서 인증을 확인하는 유틸리티
 * Authorization 헤더에서 Bearer 토큰을 추출하여 사용자 정보를 조회
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  const accessToken = extractBearerToken(authHeader);

  if (!accessToken) {
    return {
      user: null,
      error: '인증이 필요합니다. 로그인해주세요.',
    };
  }

  try {
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return {
        user: null,
        error: '인증이 만료되었습니다. 다시 로그인해주세요.',
      };
    }

    return { user, error: null };
  } catch (err) {
    console.error('Auth error:', err);
    return {
      user: null,
      error: '인증 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 선택적 인증 - 로그인된 경우 사용자 정보 반환, 아니면 null
 */
export async function optionalAuth(request: NextRequest): Promise<{ user: User | null }> {
  const authHeader = request.headers.get('authorization');
  const accessToken = extractBearerToken(authHeader);

  if (!accessToken) {
    return { user: null };
  }

  try {
    const { user } = await getUserFromToken(accessToken);
    return { user: user || null };
  } catch {
    return { user: null };
  }
}
