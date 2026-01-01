'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  nickname: string;
  createdAt: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  setNickname: (nickname: string) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'dice-art-user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 닉네임 설정
  const setNickname = useCallback((nickname: string) => {
    const newUser: User = {
      nickname: nickname.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }, []);

  // 사용자 삭제
  const clearUser = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, setNickname, clearUser }}>
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
