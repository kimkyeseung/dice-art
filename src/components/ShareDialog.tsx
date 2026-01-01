'use client';

import { useState } from 'react';
import { GridState } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { NicknameDialog } from './NicknameDialog';

interface ShareDialogProps {
  gridState: GridState;
  imageData: string; // base64 encoded PNG
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareDialog({ gridState, imageData, onClose, onSuccess }: ShareDialogProps) {
  const { user, setNickname } = useUser();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNicknameDialog, setShowNicknameDialog] = useState(!user);

  const handleNicknameSubmit = (nickname: string) => {
    setNickname(nickname);
    setShowNicknameDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }

    if (!user?.nickname) {
      setShowNicknameDialog(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          authorName: user.nickname,
          gridState,
          imageData,
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
    }
  };

  // 닉네임 설정 다이얼로그
  if (showNicknameDialog) {
    return (
      <NicknameDialog
        onSubmit={handleNicknameSubmit}
        onClose={onClose}
        title="닉네임 설정"
        description="갤러리에 공유하려면 닉네임이 필요합니다."
        submitLabel="설정하고 계속"
      />
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
          <div className="mb-4 p-3 bg-neutral-50 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-sm text-neutral-500">작성자</span>
              <p className="font-medium text-neutral-800">{user?.nickname}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNicknameDialog(true)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              변경
            </button>
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
                  업로드 중...
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
