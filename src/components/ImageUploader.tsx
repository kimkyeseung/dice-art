'use client';

import { useCallback, useState, useRef, useEffect } from 'react';

interface PicsumImage {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

interface PresetImage {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  author: string;
}

interface ImageUploaderProps {
  onImageLoad: (imageData: string, image: HTMLImageElement) => void;
}

export function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [randomPresets, setRandomPresets] = useState<PresetImage[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lorem Picsum API에서 랜덤 이미지 4개 가져오기
  useEffect(() => {
    const fetchRandomImages = async () => {
      setIsLoadingPresets(true);
      try {
        // 랜덤 페이지에서 이미지 가져오기 (총 ~1000개 이미지 중에서)
        const randomPage = Math.floor(Math.random() * 30) + 1;
        const response = await fetch(
          `https://picsum.photos/v2/list?page=${randomPage}&limit=30`
        );

        if (!response.ok) throw new Error('Failed to fetch images');

        const images: PicsumImage[] = await response.json();

        // 랜덤하게 4개 선택
        const shuffled = images.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 4).map((img) => ({
          id: img.id,
          url: `https://picsum.photos/id/${img.id}/800/800`,
          thumbnail: `https://picsum.photos/id/${img.id}/200/200`,
          alt: `Photo by ${img.author}`,
          author: img.author,
        }));

        setRandomPresets(selected);
      } catch {
        // 실패 시 기본 이미지 사용 (유명한 picsum 이미지들)
        setRandomPresets([
          { id: '1', url: 'https://picsum.photos/id/1/800/800', thumbnail: 'https://picsum.photos/id/1/200/200', alt: 'Laptop', author: 'Alejandro Escamilla' },
          { id: '10', url: 'https://picsum.photos/id/10/800/800', thumbnail: 'https://picsum.photos/id/10/200/200', alt: 'Forest', author: 'Paul Jarvis' },
          { id: '20', url: 'https://picsum.photos/id/20/800/800', thumbnail: 'https://picsum.photos/id/20/200/200', alt: 'Bird', author: 'Aleks Dorohovich' },
          { id: '30', url: 'https://picsum.photos/id/30/800/800', thumbnail: 'https://picsum.photos/id/30/200/200', alt: 'Coffee', author: 'Jared Erondu' },
        ]);
      } finally {
        setIsLoadingPresets(false);
      }
    };

    fetchRandomImages();
  }, []);

  // 새로운 랜덤 이미지 가져오기
  const refreshPresets = useCallback(async () => {
    setIsLoadingPresets(true);
    setError(null);
    try {
      const randomPage = Math.floor(Math.random() * 30) + 1;
      const response = await fetch(
        `https://picsum.photos/v2/list?page=${randomPage}&limit=30`
      );

      if (!response.ok) throw new Error('Failed to fetch images');

      const images: PicsumImage[] = await response.json();
      const shuffled = images.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 4).map((img) => ({
        id: img.id,
        url: `https://picsum.photos/id/${img.id}/800/800`,
        thumbnail: `https://picsum.photos/id/${img.id}/200/200`,
        alt: `Photo by ${img.author}`,
        author: img.author,
      }));

      setRandomPresets(selected);
    } catch {
      setError('이미지를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoadingPresets(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

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

  const handlePresetSelect = useCallback(async (preset: PresetImage) => {
    setError(null);
    setLoadingPreset(preset.id);

    try {
      const response = await fetch(preset.url);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          onImageLoad(dataUrl, img);
          setLoadingPreset(null);
        };
        img.onerror = () => {
          setError('이미지를 불러올 수 없습니다.');
          setLoadingPreset(null);
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        setError('이미지를 처리할 수 없습니다.');
        setLoadingPreset(null);
      };
      reader.readAsDataURL(blob);
    } catch {
      setError('이미지를 다운로드할 수 없습니다. 잠시 후 다시 시도해주세요.');
      setLoadingPreset(null);
    }
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
    <div className="w-full space-y-6">
      {/* 파일 업로드 영역 */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 sm:p-12
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

      {/* 프리셋 이미지 선택 */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <p className="text-sm text-neutral-600">
            또는 아래 샘플 이미지로 시작해보세요
          </p>
          <button
            onClick={refreshPresets}
            disabled={isLoadingPresets || loadingPreset !== null}
            className="p-1 rounded-full hover:bg-neutral-100 transition-colors disabled:opacity-50"
            title="다른 이미지 보기"
          >
            <svg
              className={`w-4 h-4 text-neutral-500 ${isLoadingPresets ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {isLoadingPresets ? (
            // 로딩 스켈레톤
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-neutral-200 animate-pulse"
              />
            ))
          ) : (
            randomPresets.map((preset) => (
              <button
                key={preset.id}
                data-testid="preset-image"
                onClick={() => handlePresetSelect(preset)}
                disabled={loadingPreset !== null}
                className={`
                  relative aspect-square rounded-lg overflow-hidden
                  border-2 transition-all duration-200
                  ${loadingPreset === preset.id
                    ? 'border-blue-500 opacity-70'
                    : 'border-transparent hover:border-blue-400 hover:shadow-md'
                  }
                  ${loadingPreset !== null && loadingPreset !== preset.id ? 'opacity-50' : ''}
                `}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.thumbnail}
                  alt={preset.alt}
                  className="w-full h-full object-cover"
                />
                {loadingPreset === preset.id && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <p className="text-xs text-white truncate">{preset.author}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <p className="text-xs text-neutral-400 text-center mt-2">
          Images from Lorem Picsum
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
}

export default ImageUploader;
