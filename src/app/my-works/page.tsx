'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkEntry } from '@/types';
import { listWorks, deleteWork, migrateOldStorage } from '@/utils/storage';
import { Header, DeleteConfirmDialog } from '@/components';

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-gradient flex flex-col">
      <Header
        workCount={works.length}
        rightContent={
          <Link href="/?upload=true" className="btn-primary text-sm">
            시작하기
          </Link>
        }
      />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">내 작업</h1>
          <p className="text-neutral-500 mt-1">
            {works.length > 0
              ? `${works.length}개의 작업이 진행 중입니다`
              : '진행 중인 작업이 없습니다'
            }
          </p>
        </div>

        {works.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center shadow-xl shadow-black/5 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-800 mb-2">
              아직 진행 중인 작업이 없습니다
            </h3>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
              새 이미지를 업로드하여 주사위 아트를 시작해보세요!
            </p>
            <Link
              href="/?upload=true"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              시작하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work, index) => (
              <div
                key={work.id}
                className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 cursor-pointer group hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleWorkClick(work.id)}
              >
                {/* 상단: 그리드 크기 + 진행률 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      work.progress === 100
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {work.progress === 100 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-800">{work.gridSize}</p>
                      <p className="text-xs text-neutral-400">{formatDate(work.updatedAt)}</p>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    work.progress === 100 ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {work.progress}%
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      work.progress === 100
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}
                    style={{ width: `${work.progress}%` }}
                  />
                </div>

                {/* 버튼들 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWorkClick(work.id);
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      work.progress === 100
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    }`}
                  >
                    {work.progress === 100 ? '완성작 보기' : '이어서 작업'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(work);
                    }}
                    className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="삭제"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-neutral-200/50 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 text-center text-sm text-neutral-400">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-3">
              <Link href="/gallery" className="hover:text-neutral-600 transition-colors">
                갤러리
              </Link>
              <span className="text-neutral-200">•</span>
              <span>&copy; {new Date().getFullYear()} kimkyeseung</span>
            </div>
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
