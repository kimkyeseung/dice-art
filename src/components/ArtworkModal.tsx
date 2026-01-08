'use client';

import { useState } from 'react';
import { Artwork } from '@/types';
import Image from 'next/image';
import { CommentSection } from './CommentSection';

interface ArtworkModalProps {
  artwork: Artwork;
  onClose: () => void;
  onLike?: () => void;
}

export function ArtworkModal({ artwork, onClose, onLike }: ArtworkModalProps) {
  const [likes, setLikes] = useState(artwork.likes);
  const [isLiking, setIsLiking] = useState(false);

  const formattedDate = new Date(artwork.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/artworks/${artwork.id}?action=like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        onLike?.();
      }
    } catch (error) {
      console.error('Failed to like artwork:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = artwork.imageUrl;
    link.download = `${artwork.title}.png`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-bold text-neutral-800">{artwork.title}</h2>
            <p className="text-sm text-neutral-500">by {artwork.authorName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
          >
            ✕
          </button>
        </div>

        {/* 이미지 */}
        <div className="flex-1 overflow-auto bg-neutral-100 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <Image
              src={artwork.imageUrl}
              alt={artwork.title}
              width={artwork.width * 30}
              height={artwork.height * 30}
              className="object-contain max-h-[40vh]"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>
        </div>

        {/* 댓글 섹션 */}
        <CommentSection artworkId={artwork.id} />

        {/* 푸터 */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>{artwork.width} × {artwork.height} 칸</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isLiking
                  ? 'bg-neutral-100 text-neutral-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-500'
              }`}
            >
              <span>♥</span>
              <span>{likes}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtworkModal;
