import { GridState, WorkState } from '@/types';

const STORAGE_KEY = 'dice-art-work';

/**
 * 작업 상태를 localStorage에 저장합니다.
 */
export function saveWork(
  gridState: GridState,
  originalImageData: string,
  existingId?: string
): WorkState {
  const now = Date.now();
  const workState: WorkState = {
    id: existingId || `work-${now}`,
    gridState,
    originalImageData,
    createdAt: existingId ? (loadWork()?.createdAt || now) : now,
    updatedAt: now,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workState));
    console.log('[Dice Art] 작업이 저장되었습니다.', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('[Dice Art] 저장 실패:', error);
  }

  return workState;
}

/**
 * localStorage에서 작업 상태를 불러옵니다.
 */
export function loadWork(): WorkState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const workState: WorkState = JSON.parse(data);

    // 데이터 유효성 검사
    if (!workState.gridState || !workState.originalImageData) {
      return null;
    }

    return workState;
  } catch (error) {
    console.error('[Dice Art] 불러오기 실패:', error);
    return null;
  }
}

/**
 * localStorage에서 작업 상태를 삭제합니다.
 */
export function clearWork(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Dice Art] 저장된 작업이 삭제되었습니다.');
  } catch (error) {
    console.error('[Dice Art] 삭제 실패:', error);
  }
}

/**
 * 저장된 작업이 있는지 확인합니다.
 */
export function hasSavedWork(): boolean {
  return loadWork() !== null;
}

/**
 * 저장된 작업의 요약 정보를 반환합니다.
 */
export function getSavedWorkSummary(): {
  exists: boolean;
  gridSize?: string;
  progress?: number;
  lastUpdated?: string;
} {
  const work = loadWork();

  if (!work) {
    return { exists: false };
  }

  // 진행률 계산
  let filled = 0;
  let total = 0;
  for (const row of work.gridState.cells) {
    for (const cell of row) {
      total++;
      if (cell.filledValue !== null) {
        filled++;
      }
    }
  }
  const progress = total > 0 ? Math.round((filled / total) * 100) : 0;

  return {
    exists: true,
    gridSize: `${work.gridState.width} × ${work.gridState.height}`,
    progress,
    lastUpdated: new Date(work.updatedAt).toLocaleString('ko-KR'),
  };
}
