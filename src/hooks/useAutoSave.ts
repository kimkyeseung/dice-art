'use client';

import { useEffect, useCallback } from 'react';
import { GridState } from '@/types';
import { saveWork } from '@/utils/storage';

const AUTO_SAVE_INTERVAL = 60 * 1000; // 1분

interface UseAutoSaveOptions {
  workId: string;
  gridState: GridState | null;
  originalImageData: string | null;
  enabled?: boolean;
}

export function useAutoSave({
  workId,
  gridState,
  originalImageData,
  enabled = true,
}: UseAutoSaveOptions) {
  // 수동 저장 함수
  const save = useCallback(() => {
    if (!gridState || !originalImageData) return null;

    const savedWork = saveWork(workId, gridState, originalImageData);
    return savedWork;
  }, [workId, gridState, originalImageData]);

  // 자동 저장 (1분마다)
  useEffect(() => {
    if (!enabled || !gridState || !originalImageData) return;

    const intervalId = setInterval(() => {
      save();
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [enabled, gridState, originalImageData, save]);

  // 페이지 언로드 시 저장
  useEffect(() => {
    if (!enabled || !gridState || !originalImageData) return;

    const handleBeforeUnload = () => {
      save();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, gridState, originalImageData, save]);

  return {
    save,
  };
}

export default useAutoSave;
