'use client';

import { useState, useEffect } from 'react';

interface DeleteConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteConfirmDialog({
  title,
  message,
  onConfirm,
  onClose,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setIsVisible(false);
    setTimeout(onClose, 200);
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
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-neutral-800 mb-2 text-center">{title}</h2>
        <p className="text-neutral-500 mb-8 text-center text-sm leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all font-medium disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3.5 text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                삭제 중
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
