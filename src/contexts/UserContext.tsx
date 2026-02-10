'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, toAuthUser, AuthUser, signOut as supabaseSignOut, updateNickname, getSession } from '@/lib/supabase';

interface UserContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  updateUserNickname: (nickname: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // DB에 사용자 레코드 생성/업데이트
  const syncUserToDatabase = useCallback(async () => {
    try {
      const { session } = await getSession();
      if (!session) return;

      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error('Failed to sync user to database:', error);
    }
  }, []);

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setSupabaseUser(currentUser);
        setUser(toAuthUser(currentUser));
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setSupabaseUser(null);
      setUser(null);
    }
  }, []);

  // 초기 로드 및 Auth 상태 변경 구독
  useEffect(() => {
    // null 체크 후 로컬 변수에 할당하여 TypeScript가 이해하도록 함
    const supabaseClient = supabase;
    if (!supabaseClient) {
      setIsLoading(false);
      return;
    }

    // 현재 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session?.user) {
          setSupabaseUser(session.user);
          setUser(toAuthUser(session.user));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Auth 상태 변경 구독
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSupabaseUser(session.user);
          setUser(toAuthUser(session.user));

          // 로그인/회원가입 시 DB에 사용자 레코드 동기화
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            // 약간의 지연 후 동기화 (상태 업데이트 후 실행)
            setTimeout(() => {
              syncUserToDatabase();
            }, 100);
          }
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserToDatabase]);

  // 로그아웃
  const signOut = useCallback(async () => {
    const { error } = await supabaseSignOut();
    if (error) {
      console.error('Sign out error:', error);
    }
    setSupabaseUser(null);
    setUser(null);
  }, []);

  // 닉네임 업데이트
  const updateUserNickname = useCallback(async (nickname: string) => {
    const { error } = await updateNickname(nickname);

    if (!error) {
      // 로컬 상태 업데이트
      setUser((prev) => prev ? { ...prev, nickname } : null);
      // Supabase에서 최신 정보 가져오기
      await refreshUser();
    }

    return { error };
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        supabaseUser,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        updateUserNickname,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;
