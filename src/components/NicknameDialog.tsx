'use client';

import { useState } from 'react';

interface NicknameDialogProps {
  onSubmit: (nickname: string) => void;
  onClose?: () => void;
  initialValue?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  showCancel?: boolean;
}

export function NicknameDialog({
  onSubmit,
  onClose,
  initialValue = '',
  title = '닉네임 설정',
  description = '갤러리에서 사용할 닉네임을 입력해 주세요.',
  submitLabel = '확인',
  showCancel = true,
}: NicknameDialogProps) {
  const [nickname, setNickname] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = nickname.trim();

    if (!trimmed) {
      setError('닉네임을 입력해 주세요.');
      return;
    }

    if (trimmed.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }

    if (trimmed.length > 20) {
      setError('닉네임은 20자를 초과할 수 없습니다.');
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-neutral-800 mb-2">
          {title}
        </h2>
        <p className="text-neutral-600 mb-6">
          {description}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError(null);
              }}
              placeholder="닉네임"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
            />
            {error && (
              <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            {showCancel && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-medium"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              className={`${showCancel ? 'flex-1' : 'w-full'} px-4 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium`}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NicknameDialog;
