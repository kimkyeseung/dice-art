'use client';

import { ArtworkListItem } from '@/types';

interface ArtworkCardProps {
  artwork: ArtworkListItem;
  onClick?: () => void;
}

export function ArtworkCard({ artwork, onClick }: ArtworkCardProps) {
  const formattedDate = new Date(artwork.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden text-left w-full"
    >
      {/* 썸네일 - base64 인라인 이미지이므로 Next Image 최적화 불필요 */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.thumbnailData}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* 정보 */}
      <div className="p-3 sm:p-4">
        <h3 className="font-medium text-neutral-800 truncate text-sm sm:text-base">
          {artwork.title}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          {artwork.authorName}
        </p>
        <div className="flex items-center justify-between mt-2 text-xs text-neutral-400">
          <span>{artwork.width} × {artwork.height}</span>
          <span>{formattedDate}</span>
        </div>
        {artwork.likes > 0 && (
          <div className="mt-2 text-xs text-red-500">
            ♥ {artwork.likes}
          </div>
        )}
      </div>
    </button>
  );
}

export default ArtworkCard;
