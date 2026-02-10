import { createClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Image storage will not work.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const STORAGE_BUCKET = 'artworks';

/**
 * Supabase Storage가 설정되어 있는지 확인
 */
export function isStorageConfigured(): boolean {
  return supabase !== null;
}

/**
 * 이미지의 공개 URL 생성
 */
export function getPublicUrl(path: string): string {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ========== Auth 관련 함수들 ==========

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
}

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUp(email: string, password: string, nickname: string): Promise<{ user: User | null; error: Error | null }> {
  if (!supabase) {
    return { user: null, error: new Error('Supabase is not configured') };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
      },
    },
  });

  if (error) {
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  if (!supabase) {
    return { user: null, session: null, error: new Error('Supabase is not configured') };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, session: null, error };
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Google OAuth 로그인
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { error };
  }

  return { error: null };
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error };
  }

  return { error: null };
}

/**
 * 현재 로그인된 사용자 조회
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
  if (!supabase) {
    return { user: null, error: new Error('Supabase is not configured') };
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error };
  }

  return { user, error: null };
}

/**
 * 현재 세션 조회
 */
export async function getSession(): Promise<{ session: Session | null; error: Error | null }> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase is not configured') };
  }

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return { session: null, error };
  }

  return { session, error: null };
}

/**
 * User 객체에서 AuthUser로 변환
 */
export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Anonymous',
    avatarUrl: user.user_metadata?.avatar_url,
  };
}

/**
 * 닉네임 업데이트
 */
export async function updateNickname(nickname: string): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') };
  }

  const { error } = await supabase.auth.updateUser({
    data: { nickname },
  });

  if (error) {
    return { error };
  }

  return { error: null };
}
