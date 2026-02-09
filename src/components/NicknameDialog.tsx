'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsVisible(true);
    // 모달이 열릴 때 입력 필드에 포커스
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 200);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 아이콘 */}
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-neutral-800 mb-2 text-center">
          {title}
        </h2>
        <p className="text-neutral-500 mb-6 text-center text-sm">
          {description}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError(null);
              }}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              className="w-full px-4 py-4 bg-neutral-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-center text-lg font-medium transition-all"
            />
            {error && (
              <p className="mt-3 text-sm text-red-500 text-center flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-400 text-center">
              2-20자
            </p>
          </div>

          <div className="flex gap-3">
            {showCancel && onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all font-medium"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              className={`${showCancel ? 'flex-1' : 'w-full'} btn-primary py-3.5`}
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
