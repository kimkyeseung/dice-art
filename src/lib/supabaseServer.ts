import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 서버 사이드에서 사용하는 Supabase 클라이언트
 * API 라우트에서 사용자 인증을 검증할 때 사용
 */
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 요청 헤더에서 Authorization Bearer 토큰 추출
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Access Token으로 사용자 정보 조회
 */
export async function getUserFromToken(accessToken: string) {
  if (!supabaseUrl) {
    return { user: null, error: new Error('Supabase URL not configured') };
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    return { user: null, error: new Error('Supabase anon key not configured') };
  }

  // anon key로 클라이언트 생성 후 토큰으로 사용자 조회
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    return { user: null, error };
  }

  return { user, error: null };
}
