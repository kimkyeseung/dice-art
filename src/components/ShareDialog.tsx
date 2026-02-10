'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GridState } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { generateResizedImages } from '@/utils/imageResize';
import { uploadArtworkImages, isStorageConfigured } from '@/utils/supabaseStorage';
import { getSession } from '@/lib/supabase';

interface ShareDialogProps {
  gridState: GridState;
  imageData: string; // base64 encoded PNG (원본)
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareDialog({ gridState, imageData, onClose, onSuccess }: ShareDialogProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isUserLoading } = useUser();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }

    if (!isStorageConfigured()) {
      setError('이미지 스토리지가 설정되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 세션 토큰 가져오기
      const { session, error: sessionError } = await getSession();

      if (sessionError || !session) {
        setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }

      // 1. 임시 ID 생성 (cuid 형식)
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 2. 3종 이미지 생성 (thumbnail, preview, original)
      setUploadProgress('이미지 처리 중...');
      const resizedImages = await generateResizedImages(imageData);

      // 3. Supabase Storage에 업로드
      setUploadProgress('업로드 중...');
      const uploadedUrls = await uploadArtworkImages(tempId, resizedImages);

      // 4. DB에 저장 (인증 토큰 포함)
      setUploadProgress('저장 중...');
      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          authorName: user?.nickname || 'Anonymous',
          gridState,
          imageUrl: uploadedUrls.originalUrl,
          thumbnailUrl: uploadedUrls.thumbnailUrl,
          previewUrl: uploadedUrls.previewUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '업로드에 실패했습니다.');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  // 로딩 중
  if (isUserLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // 로그인 필요 화면
  if (!isAuthenticated) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-800 mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-neutral-600 mb-6">
              갤러리에 작품을 공유하려면 로그인이 필요합니다.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-medium"
              >
                취소
              </button>
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="flex-1 px-4 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium text-center"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-neutral-800 mb-2">
          갤러리에 공유하기
        </h2>
        <p className="text-neutral-600 mb-6">
          완성된 작품을 갤러리에 공유해 보세요!
        </p>

        <form onSubmit={handleSubmit}>
          {/* 작성자 정보 */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm text-neutral-500">작성자</span>
              <p className="font-medium text-neutral-800">{user?.nickname}</p>
            </div>
          </div>

          {/* 제목 */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              작품 제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="작품의 제목을 입력하세요"
              maxLength={100}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* 에러 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {uploadProgress || '업로드 중...'}
                </>
              ) : (
                '공유하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShareDialog;
