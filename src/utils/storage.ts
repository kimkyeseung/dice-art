import { GridState, WorkState, WorkEntry } from '@/types';

const WORKS_LIST_KEY = 'dice-art-works';
const WORK_KEY_PREFIX = 'dice-art-work-';
const OLD_STORAGE_KEY = 'dice-art-work'; // 마이그레이션용

/**
 * UUID v4 생성
 */
export function generateWorkId(): string {
  return crypto.randomUUID();
}

/**
 * 진행률 계산
 */
function calculateProgress(gridState: GridState): number {
  let filled = 0;
  let total = 0;
  for (const row of gridState.cells) {
    for (const cell of row) {
      total++;
      if (cell.filledValue !== null) {
        filled++;
      }
    }
  }
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

/**
 * 작업 목록 가져오기
 */
export function listWorks(): WorkEntry[] {
  try {
    const data = localStorage.getItem(WORKS_LIST_KEY);
    if (!data) return [];
    return JSON.parse(data) as WorkEntry[];
  } catch (error) {
    console.error('[Dice Art] 작업 목록 불러오기 실패:', error);
    return [];
  }
}

/**
 * 작업 목록 저장
 */
function saveWorksList(works: WorkEntry[]): void {
  try {
    localStorage.setItem(WORKS_LIST_KEY, JSON.stringify(works));
  } catch (error) {
    console.error('[Dice Art] 작업 목록 저장 실패:', error);
  }
}

/**
 * 작업 상태를 localStorage에 저장합니다.
 */
export function saveWork(
  workId: string,
  gridState: GridState,
  originalImageData: string
): WorkState {
  const now = Date.now();
  const existingWork = loadWork(workId);

  const workState: WorkState = {
    id: workId,
    gridState,
    originalImageData,
    createdAt: existingWork?.createdAt || now,
    updatedAt: now,
  };

  try {
    // 개별 작업 저장
    localStorage.setItem(`${WORK_KEY_PREFIX}${workId}`, JSON.stringify(workState));

    // 작업 목록 업데이트
    const works = listWorks();
    const existingIndex = works.findIndex(w => w.id === workId);
    const workEntry: WorkEntry = {
      id: workId,
      gridSize: `${gridState.width} × ${gridState.height}`,
      progress: calculateProgress(gridState),
      createdAt: workState.createdAt,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      works[existingIndex] = workEntry;
    } else {
      works.unshift(workEntry); // 새 작업은 맨 앞에
    }

    saveWorksList(works);
    console.log('[Dice Art] 작업이 저장되었습니다.', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('[Dice Art] 저장 실패:', error);
  }

  return workState;
}

/**
 * localStorage에서 작업 상태를 불러옵니다.
 */
export function loadWork(workId: string): WorkState | null {
  try {
    const data = localStorage.getItem(`${WORK_KEY_PREFIX}${workId}`);
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
 * localStorage에서 작업을 삭제합니다.
 */
export function deleteWork(workId: string): void {
  try {
    // 개별 작업 삭제
    localStorage.removeItem(`${WORK_KEY_PREFIX}${workId}`);

    // 작업 목록에서 제거
    const works = listWorks().filter(w => w.id !== workId);
    saveWorksList(works);

    console.log('[Dice Art] 작업이 삭제되었습니다:', workId);
  } catch (error) {
    console.error('[Dice Art] 삭제 실패:', error);
  }
}

/**
 * 특정 작업의 요약 정보를 반환합니다.
 */
export function getWorkSummary(workId: string): WorkEntry | null {
  const works = listWorks();
  return works.find(w => w.id === workId) || null;
}

/**
 * 저장된 작업이 있는지 확인합니다.
 */
export function hasAnyWork(): boolean {
  return listWorks().length > 0;
}

/**
 * 기존 단일 저장 방식에서 새 다중 저장 방식으로 마이그레이션
 */
export function migrateOldStorage(): void {
  try {
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldData) return;

    const oldWork: WorkState = JSON.parse(oldData);

    // 유효성 검사
    if (!oldWork.gridState || !oldWork.originalImageData) {
      localStorage.removeItem(OLD_STORAGE_KEY);
      return;
    }

    // 새 ID 생성 (기존 ID가 있으면 그대로 사용, 없으면 UUID 생성)
    const newId = oldWork.id?.startsWith('work-')
      ? generateWorkId()
      : (oldWork.id || generateWorkId());

    // 새 형식으로 저장
    const newWorkState: WorkState = {
      ...oldWork,
      id: newId,
    };

    localStorage.setItem(`${WORK_KEY_PREFIX}${newId}`, JSON.stringify(newWorkState));

    // 작업 목록에 추가
    const workEntry: WorkEntry = {
      id: newId,
      gridSize: `${oldWork.gridState.width} × ${oldWork.gridState.height}`,
      progress: calculateProgress(oldWork.gridState),
      createdAt: oldWork.createdAt || Date.now(),
      updatedAt: oldWork.updatedAt || Date.now(),
    };

    const works = listWorks();
    works.unshift(workEntry);
    saveWorksList(works);

    // 기존 데이터 삭제
    localStorage.removeItem(OLD_STORAGE_KEY);

    console.log('[Dice Art] 마이그레이션 완료:', newId);
  } catch (error) {
    console.error('[Dice Art] 마이그레이션 실패:', error);
  }
}

// ===== 하위 호환성을 위한 레거시 함수들 =====

/**
 * @deprecated 새 saveWork(workId, gridState, originalImageData) 사용
 */
export function clearWork(): void {
  console.warn('[Dice Art] clearWork는 deprecated됨. deleteWork(workId) 사용하세요.');
}

/**
 * @deprecated 새 hasAnyWork() 사용
 */
export function hasSavedWork(): boolean {
  return hasAnyWork();
}

/**
 * @deprecated 새 listWorks() 사용
 */
export function getSavedWorkSummary(): {
  exists: boolean;
  gridSize?: string;
  progress?: number;
  lastUpdated?: string;
} {
  const works = listWorks();
  if (works.length === 0) {
    return { exists: false };
  }

  // 가장 최근 작업 반환
  const latest = works[0];
  return {
    exists: true,
    gridSize: latest.gridSize,
    progress: latest.progress,
    lastUpdated: new Date(latest.updatedAt).toLocaleString('ko-KR'),
  };
}
