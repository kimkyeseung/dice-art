'use client';

import { useEffect, useRef, useCallback } from 'react';
import { GridState } from '@/types';
import { saveWork } from '@/utils/storage';

const AUTO_SAVE_INTERVAL = 60 * 1000; // 1분

interface UseAutoSaveOptions {
  gridState: GridState | null;
  originalImageData: string | null;
  workId?: string;
  enabled?: boolean;
}

export function useAutoSave({
  gridState,
  originalImageData,
  workId,
  enabled = true,
}: UseAutoSaveOptions) {
  const workIdRef = useRef<string | undefined>(workId);
  const lastSaveRef = useRef<number>(0);

  // workId 업데이트
  useEffect(() => {
    if (workId) {
      workIdRef.current = workId;
    }
  }, [workId]);

  // 수동 저장 함수
  const save = useCallback(() => {
    if (!gridState || !originalImageData) return null;

    const savedWork = saveWork(gridState, originalImageData, workIdRef.current);
    workIdRef.current = savedWork.id;
    lastSaveRef.current = Date.now();

    return savedWork;
  }, [gridState, originalImageData]);

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
    workId: workIdRef.current,
  };
}

export default useAutoSave;
