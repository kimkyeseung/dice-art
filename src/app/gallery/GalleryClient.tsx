'use client';

import { useState, useCallback } from 'react';
import { ArtworkListItem, Artwork } from '@/types';
import { ArtworkCard } from '@/components/ArtworkCard';
import { ArtworkModal } from '@/components/ArtworkModal';

interface GalleryClientProps {
  initialArtworks: ArtworkListItem[];
  initialPage: number;
  initialHasMore: boolean;
  total: number;
}

export function GalleryClient({
  initialArtworks,
  initialPage,
  initialHasMore,
}: GalleryClientProps) {
  const [artworks, setArtworks] = useState<ArtworkListItem[]>(initialArtworks);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);

  // 모달 상태
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/artworks?page=${nextPage}&limit=12`);

      if (!response.ok) throw new Error('Failed to load');

      const data = await response.json();
      setArtworks((prev) => [...prev, ...data.artworks]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to load more artworks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  // 작품 상세 보기
  const handleCardClick = async (artworkId: string) => {
    setIsLoadingDetail(true);

    try {
      const response = await fetch(`/api/artworks/${artworkId}`);

      if (!response.ok) throw new Error('Failed to load');

      const artwork: Artwork = await response.json();
      setSelectedArtwork(artwork);
    } catch (error) {
      console.error('Failed to load artwork:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedArtwork(null);
  };

  return (
    <>
      {/* 작품 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
        {artworks.map((artwork, index) => (
          <div
            key={artwork.id}
            className="animate-fade-in"
            style={{ animationDelay: `${Math.min(index, 11) * 0.05}s` }}
          >
            <ArtworkCard
              artwork={artwork}
              onClick={() => handleCardClick(artwork.id)}
            />
          </div>
        ))}
      </div>

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

      {/* 상세 모달 */}
      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          onClose={closeModal}
          onLike={() => {
            setArtworks((prev) =>
              prev.map((a) =>
                a.id === selectedArtwork.id ? { ...a, likes: a.likes + 1 } : a
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
    </>
  );
}
