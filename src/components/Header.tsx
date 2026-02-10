'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

interface NavItem {
  label: string;
  href: string;
  badge?: number;
  show?: boolean;
}

interface HeaderProps {
  /** 오른쪽 영역 커스텀 콘텐츠 */
  rightContent?: React.ReactNode;
  /** 네비게이션 표시 여부 */
  showNav?: boolean;
  /** 진행 중인 작업 수 (내 작업 배지) */
  workCount?: number;
  /** 로고 옆 상태 메시지 */
  statusMessage?: React.ReactNode;
  /** 간소화 모드 (작업 페이지용) */
  compact?: boolean;
}

export function Header({
  rightContent,
  showNav = true,
  workCount = 0,
  statusMessage,
  compact = false,
}: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, signOut } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // 프로필 메뉴 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    { label: '갤러리', href: '/gallery', show: true },
    { label: '내 작업', href: '/my-works', badge: workCount, show: true },
    { label: '공유한 작품', href: '/my-artworks', show: isAuthenticated },
  ];

  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* 글래스모피즘 배경 */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-neutral-200/50" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4">
        <div className={`flex items-center justify-between ${compact ? 'h-12 sm:h-14' : 'h-14 sm:h-16'}`}>
          {/* 왼쪽: 로고 + 상태 메시지 + 네비게이션 */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* 로고 */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-black"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity="0.9" />
                  <circle cx="7" cy="7" r="1.5" fill="white" />
                  <circle cx="12" cy="12" r="1.5" fill="white" />
                  <circle cx="17" cy="17" r="1.5" fill="white" />
                </svg>
              </div>
              <span className={`font-bold text-neutral-800 ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
                Dice Art
              </span>
            </Link>

            {/* 상태 메시지 */}
            {statusMessage && (
              <div className="hidden sm:block">
                {statusMessage}
              </div>
            )}

            {/* 데스크탑 네비게이션 */}
            {showNav && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.filter(item => item.show).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg transition-all duration-200
                      ${isActive(item.href)
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }
                    `}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`
                          px-1.5 py-0.5 text-xs rounded-full font-medium
                          ${isActive(item.href)
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 text-blue-700'
                          }
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* 오른쪽: 커스텀 콘텐츠 + 인증 버튼 + 모바일 메뉴 버튼 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {rightContent}

            {/* 데스크탑: 인증 상태에 따른 UI */}
            {showNav && !isLoading && (
              <div className="hidden md:block">
                {isAuthenticated && user ? (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-neutral-700 max-w-[100px] truncate">
                        {user.nickname}
                      </span>
                      <svg className={`w-4 h-4 text-neutral-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* 프로필 드롭다운 메뉴 */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-neutral-100">
                          <p className="text-sm font-medium text-neutral-800 truncate">{user.nickname}</p>
                          <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/my-artworks"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          공유한 작품
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          로그아웃
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    로그인
                  </Link>
                )}
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            {showNav && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="메뉴"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {showNav && isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-neutral-200/50 mt-1 pt-3">
            <nav className="flex flex-col gap-1">
              {navItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    px-3 py-2.5 text-sm rounded-lg transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-neutral-900 text-white font-medium'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }
                  `}
                >
                  <span className="flex items-center justify-between">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`
                        px-2 py-0.5 text-xs rounded-full font-medium
                        ${isActive(item.href)
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 text-blue-700'
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              ))}

              {/* 모바일 인증 영역 */}
              {!isLoading && (
                <div className="mt-2 pt-2 border-t border-neutral-200">
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-3 py-2 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{user.nickname}</p>
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full mt-1 px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm text-center font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      로그인
                    </Link>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
