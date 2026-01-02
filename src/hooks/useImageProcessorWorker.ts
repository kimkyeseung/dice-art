'use client';

import { useRef, useCallback, useEffect } from 'react';
import { GridState } from '@/types';

interface UseImageProcessorWorkerResult {
  processImage: (image: HTMLImageElement, maxCells?: number) => Promise<GridState>;
  isSupported: boolean;
}

export function useImageProcessorWorker(): UseImageProcessorWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const isSupported = typeof Worker !== 'undefined';

  // Worker 초기화
  useEffect(() => {
    if (!isSupported) return;

    workerRef.current = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url)
    );

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [isSupported]);

  const processImage = useCallback(
    (image: HTMLImageElement, maxCells: number = 50): Promise<GridState> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          // Worker가 없으면 메인 스레드에서 처리 (fallback)
          reject(new Error('Worker를 사용할 수 없습니다.'));
          return;
        }

        // 캔버스에서 이미지 데이터 추출
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, image.width, image.height);

        const handleMessage = (event: MessageEvent) => {
          const { data } = event;

          if (data.type === 'processImageResult') {
            workerRef.current?.removeEventListener('message', handleMessage);
            resolve(data.gridState);
          } else if (data.type === 'error') {
            workerRef.current?.removeEventListener('message', handleMessage);
            reject(new Error(data.message));
          }
        };

        workerRef.current.addEventListener('message', handleMessage);

        workerRef.current.postMessage({
          type: 'processImage',
          imageData,
          imageWidth: image.width,
          imageHeight: image.height,
          maxCells,
        });
      });
    },
    []
  );

  return {
    processImage,
    isSupported,
  };
}

export default useImageProcessorWorker;
