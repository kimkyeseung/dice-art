'use client';

import { useState } from 'react';

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

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
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
        <h2 className="text-xl font-bold text-neutral-800 mb-2">{title}</h2>
        <p className="text-neutral-600 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
