import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    // 코드가 없으면 홈으로 리다이렉트
    return NextResponse.redirect(`${origin}/`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    return NextResponse.redirect(`${origin}/auth/login?error=configuration`);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=auth`);
    }

    // 성공적으로 세션을 교환했으면 원래 페이지로 리다이렉트
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${origin}/auth/login?error=unknown`);
  }
}
