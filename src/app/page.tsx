'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  // 데모 이미지 hover 상태
  const [isDemoHovered, setIsDemoHovered] = useState(false);

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

      <main className="flex-1 w-full relative overflow-hidden">
        {/* 왼쪽 배경 이미지 - 데스크탑에서만 표시 */}
        <div
          className="hidden lg:block fixed left-0 top-0 bottom-0 w-[45%] cursor-pointer"
          onMouseEnter={() => setIsDemoHovered(true)}
          onMouseLeave={() => setIsDemoHovered(false)}
        >
          {/* 배경 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-neutral-100 z-10" />

          {/* Before 이미지 */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isDemoHovered ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <Image
              src="/images/before.png"
              alt="원본 이미지"
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* After 이미지 */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isDemoHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src="/images/after.png"
              alt="주사위 아트 결과"
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* 하단 레이블 */}
          <div className="absolute bottom-8 left-8 z-20">
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-all duration-500 ${
                isDemoHovered
                  ? 'bg-purple-500/90 text-white'
                  : 'bg-white/90 text-neutral-800'
              }`}
            >
              {isDemoHovered ? 'Dice Art' : 'Original'}
            </div>
            <p className="mt-2 text-xs text-white/80 drop-shadow-lg">
              {isDemoHovered ? '' : '마우스를 올려보세요'}
            </p>
          </div>

          {/* Anna 크레딧 */}
          <div className="absolute bottom-8 right-8 z-20">
            <a
              href="https://www.instagram.com/anna.dice.artworks/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-xs text-white/90 hover:bg-black/60 transition-colors"
            >
              Inspired by @anna.dice.artworks
            </a>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="lg:ml-[45%] min-h-full">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
            {/* 로딩 */}
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                <p className="mt-4 text-neutral-600">이미지 분석 중...</p>
              </div>
            ) : (
              <div className="space-y-10 sm:space-y-12">
                {/* 모바일용 데모 이미지 */}
                <section
                  className="lg:hidden relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl cursor-pointer"
                  onTouchStart={() => setIsDemoHovered(true)}
                  onTouchEnd={() => setIsDemoHovered(false)}
                  onClick={() => setIsDemoHovered(!isDemoHovered)}
                >
                  {/* Before 이미지 */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      isDemoHovered ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <Image
                      src="/images/before.png"
                      alt="원본 이미지"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  {/* After 이미지 */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      isDemoHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Image
                      src="/images/after.png"
                      alt="주사위 아트 결과"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  {/* 레이블 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-500 ${
                          isDemoHovered
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/90 text-neutral-800'
                        }`}
                      >
                        {isDemoHovered ? 'Dice Art' : 'Original'}
                      </span>
                      <span className="text-white/80 text-xs">터치해보세요</span>
                    </div>
                  </div>
                </section>

                {/* 히어로 섹션 */}
                <section className="text-center">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4 sm:mb-6">
                    이미지를 주사위 아트로
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      변환하세요
                    </span>
                  </h2>
                  <p className="text-neutral-600 leading-relaxed max-w-xl mx-auto text-sm sm:text-base">
                    Dice Art는 이미지를 주사위 눈금으로 표현하는 독특한 모자이크 아트 도구입니다.
                    업로드한 이미지의 밝기를 분석하여 주사위 값으로 변환하고,
                    직접 채워나가며 작품을 완성하세요.
                  </p>

                  {/* 모바일용 Anna 크레딧 */}
                  <div className="lg:hidden mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-full text-sm text-neutral-600">
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
                </section>

                {/* 이미지 업로더 섹션 */}
                <section>
                  <div className="text-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-800 mb-2">
                      나만의 작품 만들기
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      이미지를 업로드하고 주사위 아트를 시작하세요
                    </p>
                  </div>

                  <ImageUploader onImageLoad={handleImageLoad} />

                  <div className="mt-6 space-y-2 text-center">
                    <p className="text-xs sm:text-sm text-neutral-500">
                      업로드한 이미지는 주사위 눈의 밝기로 변환됩니다.
                    </p>
                    <p className="text-xs text-neutral-400">
                      진행 상황은 1분마다 자동으로 저장됩니다.
                    </p>
                  </div>

                  {/* 진행 중인 작업이 있으면 안내 */}
                  {workCount > 0 && (
                    <div className="mt-8 text-center">
                      <Link
                        href="/my-works"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 text-sm font-medium"
                      >
                        진행 중인 작업 {workCount}개 보기
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-neutral-200 bg-white mt-auto lg:ml-[45%]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/gallery" className="hover:text-neutral-700 transition-colors">
                Gallery
              </Link>
              <span className="text-neutral-300">|</span>
              <span>&copy; {new Date().getFullYear()} kimkyeseung</span>
            </div>
            <span className="text-neutral-300 hidden sm:inline lg:hidden">|</span>
            <span className="text-neutral-400 lg:hidden">
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
