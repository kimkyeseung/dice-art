'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArtworkListItem, ArtworkListResponse, Artwork } from '@/types';
import { Header } from '@/components/Header';
import { ArtworkCard } from '@/components/ArtworkCard';
import { ArtworkModal } from '@/components/ArtworkModal';

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<ArtworkListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // 모달 상태
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 작품 목록 불러오기
  const fetchArtworks = useCallback(async (pageNum: number, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/artworks?page=${pageNum}&limit=12`);

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
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchArtworks(1);
  }, [fetchArtworks]);

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

  return (
    <div className="min-h-screen mesh-gradient flex flex-col">
      <Header
        rightContent={
          <Link
            href="/?upload=true"
            className="btn-primary text-sm"
          >
            시작하기
          </Link>
        }
      />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">갤러리</h1>
          {total > 0 && (
            <p className="text-neutral-500 mt-1">
              {total}개의 작품
            </p>
          )}
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
              아직 공유된 작품이 없습니다
            </h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
              첫 번째 작품을 만들어 갤러리에 공유해 보세요!
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
        )}

        {/* 작품 그리드 */}
        {artworks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
            {artworks.map((artwork, index) => (
              <div
                key={artwork.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ArtworkCard
                  artwork={artwork}
                  onClick={() => handleCardClick(artwork.id)}
                />
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
            <button
              onClick={loadMore}
              className="btn-secondary px-8 py-3"
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

      {/* 상세 로딩 오버레이 */}
      {isLoadingDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 푸터 */}
      <footer className="border-t border-neutral-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-neutral-400">
          &copy; {new Date().getFullYear()} kimkyeseung
        </div>
      </footer>
    </div>
  );
}
