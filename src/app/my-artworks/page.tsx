'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ArtworkListItem, ArtworkListResponse, Artwork } from '@/types';
import { Header, ArtworkCard, ArtworkModal, NicknameDialog, DeleteConfirmDialog } from '@/components';

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

  // 모달 열릴 때 스크롤 잠금
  useEffect(() => {
    if (selectedArtwork) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedArtwork]);

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

      setArtworks((prev) => prev.filter((a) => a.id !== artworkToDelete.id));
      setTotal((prev) => prev - 1);
      setArtworkToDelete(null);

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
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  // 닉네임 미설정
  if (!user?.nickname) {
    return (
      <div className="min-h-screen mesh-gradient flex flex-col">
        <Header
          onNicknameClick={() => setShowNicknameDialog(true)}
          rightContent={
            <Link href="/" className="btn-secondary text-sm">
              홈으로
            </Link>
          }
        />

        <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center py-10 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-700 mb-2">
              닉네임을 설정해 주세요
            </h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
              내 작품을 보려면 먼저 닉네임을 설정해야 합니다.
            </p>
            <button
              onClick={() => setShowNicknameDialog(true)}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
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
    <div className="min-h-screen mesh-gradient flex flex-col">
      <Header
        nickname={user?.nickname}
        onNicknameClick={() => setShowNicknameDialog(true)}
        rightContent={
          <Link href="/?upload=true" className="btn-primary text-sm">
            시작하기
          </Link>
        }
      />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-8 flex-1">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">공유한 작품</h1>
          <p className="text-neutral-500 mt-1">
            {total > 0 ? `${total}개의 작품` : '아직 공유한 작품이 없습니다'}
          </p>
        </div>

        {/* 에러 */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={() => fetchArtworks(1)}
                className="text-sm text-red-600 hover:text-red-700 underline mt-1"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && artworks.length === 0 && !error && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-700 mb-2">
              아직 공유한 작품이 없습니다
            </h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
              작품을 완성하고 갤러리에 공유해 보세요!
            </p>
            <Link href="/?upload=true" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              시작하기
            </Link>
          </div>
        )}

        {/* 작품 그리드 */}
        {artworks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
            {artworks.map((artwork, index) => (
              <div
                key={artwork.id}
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ArtworkCard
                  artwork={artwork}
                  onClick={() => handleCardClick(artwork.id)}
                />
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => handleDeleteClick(artwork, e)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-red-500 text-neutral-400 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg backdrop-blur-sm"
                  title="삭제"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="spinner" />
          </div>
        )}

        {/* 더 불러오기 */}
        {hasMore && !isLoading && (
          <div className="text-center mt-12">
            <button onClick={loadMore} className="btn-secondary px-8 py-3">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 닉네임 다이얼로그 */}
      {showNicknameDialog && (
        <NicknameDialog
          onSubmit={handleNicknameSubmit}
          onClose={() => setShowNicknameDialog(false)}
          initialValue={user?.nickname}
          title="닉네임 변경"
          description="새 닉네임을 입력해 주세요."
          submitLabel="변경"
        />
      )}

      {/* 푸터 */}
      <footer className="border-t border-neutral-200/50 bg-white/50 backdrop-blur-sm">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 text-center text-sm text-neutral-400">
          &copy; {new Date().getFullYear()} kimkyeseung
        </div>
      </footer>
    </div>
  );
}
