'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ArtworkListItem, ArtworkListResponse, Artwork } from '@/types';
import { ArtworkCard, ArtworkModal, NicknameDialog, DeleteConfirmDialog } from '@/components';

export default function MyArtworksPage() {
  const { user, setNickname, isLoading: isUserLoading } = useUser();
  const [artworks, setArtworks] = useState<ArtworkListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // 모달 상태
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 삭제 상태
  const [artworkToDelete, setArtworkToDelete] = useState<ArtworkListItem | null>(null);

  // 닉네임 다이얼로그
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);

  // 작품 목록 불러오기
  const fetchArtworks = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!user?.nickname) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/artworks?page=${pageNum}&limit=12&author=${encodeURIComponent(user.nickname)}`
      );

      if (!response.ok) {
        throw new Error('작품을 불러오는데 실패했습니다.');
      }

      const data: ArtworkListResponse = await response.json();

      if (append) {
        setArtworks((prev) => [...prev, ...data.artworks]);
      } else {
        setArtworks(data.artworks);
      }

      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.nickname]);

  // 사용자 로드 후 작품 목록 불러오기
  useEffect(() => {
    if (!isUserLoading && user?.nickname) {
      fetchArtworks(1);
    } else if (!isUserLoading && !user?.nickname) {
      setIsLoading(false);
    }
  }, [isUserLoading, user?.nickname, fetchArtworks]);

  // 더 불러오기
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchArtworks(page + 1, true);
    }
  };

  // 작품 상세 보기
  const handleCardClick = async (artworkId: string) => {
    setIsLoadingDetail(true);

    try {
      const response = await fetch(`/api/artworks/${artworkId}`);

      if (!response.ok) {
        throw new Error('작품을 불러오는데 실패했습니다.');
      }

      const artwork: Artwork = await response.json();
      setSelectedArtwork(artwork);
    } catch (err) {
      console.error('Failed to load artwork:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedArtwork(null);
  };

  // 삭제 확인
  const handleDeleteClick = (artwork: ArtworkListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setArtworkToDelete(artwork);
  };

  // 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!artworkToDelete) return;

    try {
      const response = await fetch(`/api/artworks/${artworkToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      // 목록에서 제거
      setArtworks((prev) => prev.filter((a) => a.id !== artworkToDelete.id));
      setTotal((prev) => prev - 1);
      setArtworkToDelete(null);

      // 모달이 열려있으면 닫기
      if (selectedArtwork?.id === artworkToDelete.id) {
        setSelectedArtwork(null);
      }
    } catch (err) {
      console.error('Failed to delete artwork:', err);
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  // 닉네임 설정
  const handleNicknameSubmit = (nickname: string) => {
    setNickname(nickname);
    setShowNicknameDialog(false);
  };

  // 로딩 중
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  // 닉네임 미설정
  if (!user?.nickname) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">내 작품</h1>
              <p className="text-sm text-neutral-500">내가 공유한 작품들</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
            >
              홈으로
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl font-bold text-neutral-700 mb-2">
              닉네임을 설정해 주세요
            </h2>
            <p className="text-neutral-500 mb-6">
              내 작품을 보려면 먼저 닉네임을 설정해야 합니다.
            </p>
            <button
              onClick={() => setShowNicknameDialog(true)}
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              닉네임 설정하기
            </button>
          </div>
        </main>

        {showNicknameDialog && (
          <NicknameDialog
            onSubmit={handleNicknameSubmit}
            onClose={() => setShowNicknameDialog(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* 헤더 */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">내 작품</h1>
            <p className="text-sm text-neutral-500">
              {total > 0 ? `${total}개의 작품` : '아직 공유한 작품이 없습니다'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/gallery"
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
            >
              갤러리
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
            >
              작품 만들기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700 mb-6">
            {error}
            <button
              onClick={() => fetchArtworks(1)}
              className="ml-4 underline hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && artworks.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-xl font-bold text-neutral-700 mb-2">
              아직 공유한 작품이 없습니다
            </h2>
            <p className="text-neutral-500 mb-6">
              작품을 완성하고 갤러리에 공유해 보세요!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              작품 만들기
            </Link>
          </div>
        )}

        {/* 작품 그리드 */}
        {artworks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="relative group">
                <ArtworkCard
                  artwork={artwork}
                  onClick={() => handleCardClick(artwork.id)}
                />
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => handleDeleteClick(artwork, e)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                  title="삭제"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
          </div>
        )}

        {/* 더 불러오기 */}
        {hasMore && !isLoading && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors text-neutral-700"
            >
              더 보기
            </button>
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          onClose={closeModal}
          onLike={() => {
            setArtworks((prev) =>
              prev.map((a) =>
                a.id === selectedArtwork.id
                  ? { ...a, likes: a.likes + 1 }
                  : a
              )
            );
          }}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {artworkToDelete && (
        <DeleteConfirmDialog
          title="작품 삭제"
          message={`"${artworkToDelete.title}" 작품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={handleDeleteConfirm}
          onClose={() => setArtworkToDelete(null)}
        />
      )}

      {/* 상세 로딩 오버레이 */}
      {isLoadingDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 푸터 */}
      <footer className="border-t border-neutral-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-neutral-500">
          Dice Art Gallery
        </div>
      </footer>
    </div>
  );
}
