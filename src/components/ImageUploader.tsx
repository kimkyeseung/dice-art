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
  /** 컴포넌트 마운트 시 자동으로 파일 선택 다이얼로그 열기 */
  autoTrigger?: boolean;
}

export function ImageUploader({ onImageLoad, autoTrigger = false }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [randomPresets, setRandomPresets] = useState<PresetImage[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // autoTrigger가 true면 자동으로 파일 선택 다이얼로그 열기
  useEffect(() => {
    if (autoTrigger && fileInputRef.current) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger]);

  // Lorem Picsum API에서 랜덤 이미지 4개 가져오기
  useEffect(() => {
    const fetchRandomImages = async () => {
      setIsLoadingPresets(true);
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
          relative rounded-2xl p-8 sm:p-10
          flex flex-col items-center justify-center gap-4
          cursor-pointer transition-all duration-300
          ${isDragging
            ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-400 shadow-lg shadow-blue-500/10'
            : 'bg-neutral-50 border-2 border-dashed border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100/50'
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
          w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
          ${isDragging
            ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30 scale-110'
            : 'bg-white shadow-md'
          }
        `}>
          <svg
            className={`w-8 h-8 transition-colors duration-300 ${isDragging ? 'text-white' : 'text-neutral-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* 텍스트 */}
        <div className="text-center">
          <p className={`text-lg font-semibold transition-colors duration-300 ${
            isDragging ? 'text-blue-600' : 'text-neutral-700'
          }`}>
            {isDragging ? '여기에 놓으세요!' : '이미지 업로드'}
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            드래그 또는 클릭하여 선택
          </p>
        </div>

        {/* 지원 포맷 */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="px-2 py-1 bg-white rounded-lg shadow-sm">PNG</span>
          <span className="px-2 py-1 bg-white rounded-lg shadow-sm">JPG</span>
          <span className="px-2 py-1 bg-white rounded-lg shadow-sm">GIF</span>
          <span className="text-neutral-300">•</span>
          <span>최대 10MB</span>
        </div>
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-sm text-neutral-400 font-medium">또는</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      {/* 프리셋 이미지 선택 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-neutral-600">
            샘플 이미지로 시작하기
          </p>
          <button
            onClick={refreshPresets}
            disabled={isLoadingPresets || loadingPreset !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all disabled:opacity-50"
            title="다른 이미지 보기"
          >
            <svg
              className={`w-4 h-4 ${isLoadingPresets ? 'animate-spin' : ''}`}
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
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {isLoadingPresets ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-neutral-100 animate-pulse"
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
                  relative aspect-square rounded-xl overflow-hidden
                  transition-all duration-300 group
                  ${loadingPreset === preset.id
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 hover:shadow-lg'
                  }
                  ${loadingPreset !== null && loadingPreset !== preset.id ? 'opacity-50' : ''}
                `}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.thumbnail}
                  alt={preset.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {loadingPreset === preset.id && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs text-white truncate font-medium">{preset.author}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <p className="text-xs text-neutral-300 text-center mt-3">
          Lorem Picsum 제공
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
