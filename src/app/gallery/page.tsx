'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArtworkListItem, ArtworkListResponse, Artwork } from '@/types';
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
    <div className="min-h-screen bg-neutral-100">
      {/* 헤더 */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Gallery</h1>
            <p className="text-sm text-neutral-500">
              {total > 0 ? `${total}개의 작품` : '아직 작품이 없습니다'}
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
          >
            작품 만들기
          </Link>
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
              아직 공유된 작품이 없습니다
            </h2>
            <p className="text-neutral-500 mb-6">
              첫 번째 작품을 만들어 갤러리에 공유해 보세요!
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
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onClick={() => handleCardClick(artwork.id)}
              />
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
            // 목록에서 좋아요 수 업데이트
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
