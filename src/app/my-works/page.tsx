'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkEntry } from '@/types';
import { listWorks, deleteWork, migrateOldStorage } from '@/utils/storage';
import { DeleteConfirmDialog } from '@/components';

export default function MyWorksPage() {
  const router = useRouter();
  const [works, setWorks] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<WorkEntry | null>(null);

  useEffect(() => {
    migrateOldStorage();
    setWorks(listWorks());
    setIsLoading(false);
  }, []);

  const handleDelete = (work: WorkEntry) => {
    setDeleteTarget(work);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      deleteWork(deleteTarget.id);
      setWorks(listWorks());
      setDeleteTarget(null);
    }
  };

  const handleWorkClick = (workId: string) => {
    router.push(`/work/${workId}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
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
              <Link href="/" className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Dice Art</h1>
              </Link>
              <Link
                href="/gallery"
                className="px-3 py-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                갤러리
              </Link>
              <span className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 font-medium">
                내 작업
              </span>
            </div>
            <Link
              href="/"
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              새 작업 시작
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 mb-2">내 작업</h2>
          <p className="text-sm text-neutral-600">
            진행 중인 작업을 선택하여 이어서 작업하세요.
          </p>
        </div>

        {works.length === 0 ? (
          <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-sm">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">
              아직 진행 중인 작업이 없습니다
            </h3>
            <p className="text-neutral-600 mb-6">
              새 이미지를 업로드하여 주사위 아트를 시작해보세요!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              새 작업 시작하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work) => (
              <div
                key={work.id}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleWorkClick(work.id)}
              >
                {/* 진행률 표시 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-neutral-600">
                    {work.gridSize}
                  </span>
                  <span className={`text-sm font-bold ${
                    work.progress === 100 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {work.progress}%
                  </span>
                </div>

                {/* 진행률 바 */}
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all ${
                      work.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${work.progress}%` }}
                  />
                </div>

                {/* 날짜 */}
                <div className="text-xs text-neutral-500 mb-4">
                  <p>생성: {formatDate(work.createdAt)}</p>
                  <p>수정: {formatDate(work.updatedAt)}</p>
                </div>

                {/* 버튼들 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWorkClick(work.id);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    {work.progress === 100 ? '작품 보기' : '이어서 작업'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(work);
                    }}
                    className="px-3 py-2 text-sm bg-neutral-100 hover:bg-red-100 text-neutral-600 hover:text-red-600 rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
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

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <DeleteConfirmDialog
          title="작업 삭제"
          message={`이 작업(${deleteTarget.gridSize}, ${deleteTarget.progress}% 진행)을 삭제하시겠습니까? 삭제된 작업은 복구할 수 없습니다.`}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
