'use client';

import { useEffect, useCallback, useState } from 'react';
import { GridState } from '@/types';
import { saveWork } from '@/utils/storage';

const AUTO_SAVE_INTERVAL = 60 * 1000; // 1분
const SAVE_MESSAGE_DURATION = 1000; // 1초

export type SaveStatus = 'success' | 'error' | null;

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);

  // 수동 저장 함수
  const save = useCallback(() => {
    if (!gridState || !originalImageData) return null;

    try {
      const savedWork = saveWork(workId, gridState, originalImageData);
      setSaveStatus('success');
      return savedWork;
    } catch {
      setSaveStatus('error');
      return null;
    }
  }, [workId, gridState, originalImageData]);

  // 저장 상태 메시지 1초 후 자동 제거
  useEffect(() => {
    if (saveStatus === null) return;

    const timer = setTimeout(() => {
      setSaveStatus(null);
    }, SAVE_MESSAGE_DURATION);

    return () => clearTimeout(timer);
  }, [saveStatus]);

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
    saveStatus,
  };
}

export default useAutoSave;
