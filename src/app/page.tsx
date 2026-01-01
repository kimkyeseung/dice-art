'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageUploader, NicknameDialog } from '@/components';
import { useUser } from '@/contexts/UserContext';
import { processImage } from '@/utils/imageProcessor';
import { generateWorkId, saveWork, migrateOldStorage, listWorks } from '@/utils/storage';

export default function Home() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 사용자 상태
  const { user, setNickname } = useUser();
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);

  // 진행 중인 작업 수
  const [workCount, setWorkCount] = useState(0);

  // 초기화 (마이그레이션 포함)
  useEffect(() => {
    migrateOldStorage();
    setWorkCount(listWorks().length);
    setIsInitialized(true);
  }, []);

  const handleImageLoad = useCallback((imageData: string, image: HTMLImageElement, dimension: number = 50) => {
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const grid = processImage(image, dimension);
        const workId = generateWorkId();

        // 새 작업 저장
        saveWork(workId, grid, imageData);

        // work 페이지로 이동
        router.push(`/work/${workId}`);
      } catch (error) {
        console.error('이미지 처리 실패:', error);
        setIsProcessing(false);
      }
    }, 100);
  }, [router]);

  // 초기화 전에는 아무것도 렌더링하지 않음 (hydration 문제 방지)
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Dice Art</h1>
                <p className="text-xs sm:text-sm text-neutral-500 hidden sm:block">
                  이미지를 주사위 아트로 변환하세요
                </p>
              </div>
              <Link
                href="/gallery"
                className="px-3 py-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                갤러리
              </Link>
              <Link
                href="/my-works"
                className="px-3 py-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1"
              >
                내 작업
                {workCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {workCount}
                  </span>
                )}
              </Link>
              {user && (
                <Link
                  href="/my-artworks"
                  className="px-3 py-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  공유한 작품
                </Link>
              )}
              {/* 사용자 정보 */}
              {user ? (
                <button
                  onClick={() => setShowNicknameDialog(true)}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  {user.nickname}
                </button>
              ) : (
                <button
                  onClick={() => setShowNicknameDialog(true)}
                  className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  닉네임 설정
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1">
        {/* 로딩 */}
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            <p className="mt-4 text-neutral-600">이미지 분석 중...</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* 프로젝트 소개 섹션 */}
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-4">
                이미지를 주사위 아트로 변환하세요
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-6 px-4">
                Dice Art는 이미지를 주사위 눈금으로 표현하는 독특한 모자이크 아트 도구입니다.
                <br className="hidden sm:block" />
                업로드한 이미지의 밝기를 분석하여 1부터 6까지의 주사위 값으로 변환하고,
                <br className="hidden sm:block" />
                직접 주사위를 채워나가며 작품을 완성할 수 있습니다.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-full text-sm text-neutral-600">
                <span>Inspired by</span>
                <a
                  href="https://www.instagram.com/anna.dice.artworks/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                >
                  @anna.dice.artworks
                </a>
              </div>
            </div>

            {/* 이미지 업로더 */}
            <div className="max-w-xl mx-auto">
              <ImageUploader onImageLoad={handleImageLoad} />
              <p className="text-center text-xs sm:text-sm text-neutral-500 mt-4 sm:mt-6 px-2">
                업로드한 이미지는 주사위 눈의 밝기로 변환됩니다.<br />
                모든 칸을 주사위로 채우면 완성된 작품을 다운로드할 수 있습니다.
              </p>
              <p className="text-center text-xs text-neutral-400 mt-2">
                진행 상황은 1분마다 자동으로 저장됩니다.
              </p>
            </div>

            {/* 진행 중인 작업이 있으면 안내 */}
            {workCount > 0 && (
              <div className="mt-8 text-center">
                <Link
                  href="/my-works"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                >
                  진행 중인 작업 {workCount}개 보기
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-neutral-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/gallery" className="hover:text-neutral-700 transition-colors">
                Gallery
              </Link>
              <span className="text-neutral-300">|</span>
              <span>&copy; {new Date().getFullYear()} kimkyeseung</span>
            </div>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <span className="text-neutral-400">
              Inspired by{' '}
              <a
                href="https://www.instagram.com/anna.dice.artworks/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:text-pink-600 hover:underline"
              >
                @anna.dice.artworks
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* 닉네임 설정 다이얼로그 */}
      {showNicknameDialog && (
        <NicknameDialog
          onSubmit={(nickname) => {
            setNickname(nickname);
            setShowNicknameDialog(false);
          }}
          onClose={() => setShowNicknameDialog(false)}
          initialValue={user?.nickname || ''}
          title={user ? '닉네임 변경' : '닉네임 설정'}
          description={user ? '새 닉네임을 입력해 주세요.' : '갤러리에서 사용할 닉네임을 입력해 주세요.'}
          submitLabel={user ? '변경' : '확인'}
        />
      )}
    </div>
  );
}
