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
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left w-full hover:-translate-y-1"
    >
      {/* 썸네일 */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.thumbnailData}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 좋아요 배지 */}
        {artwork.likes > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-red-500 shadow-sm">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {artwork.likes}
          </div>
        )}

        {/* 크기 배지 */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {artwork.width} × {artwork.height}
        </div>
      </div>

      {/* 정보 */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-800 truncate text-sm sm:text-base group-hover:text-blue-600 transition-colors">
          {artwork.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-neutral-500 truncate">
            {artwork.authorName}
          </p>
          <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
            {formattedDate}
          </span>
        </div>
      </div>
    </button>
  );
}

export default ArtworkCard;
