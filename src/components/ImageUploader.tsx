'use client';

import { useCallback, useState, useRef } from 'react';

interface ImageUploaderProps {
  onImageLoad: (imageData: string, image: HTMLImageElement) => void;
}

export function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onImageLoad(dataUrl, img);
      };
      img.onerror = () => {
        setError('이미지를 불러올 수 없습니다.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError('파일을 읽을 수 없습니다.');
    };
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12
          flex flex-col items-center justify-center gap-4
          cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 아이콘 */}
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          ${isDragging ? 'bg-blue-100' : 'bg-neutral-100'}
        `}>
          <svg
            className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-neutral-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* 텍스트 */}
        <div className="text-center">
          <p className={`text-lg font-medium ${isDragging ? 'text-blue-600' : 'text-neutral-700'}`}>
            {isDragging ? '여기에 놓으세요' : '이미지를 드래그하거나 클릭하세요'}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            PNG, JPG, GIF (최대 10MB)
          </p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
}

export default ImageUploader;
