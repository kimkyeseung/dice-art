import { createClient } from '@supabase/supabase-js';

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
