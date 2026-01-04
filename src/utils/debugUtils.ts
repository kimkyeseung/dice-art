import { GridState, DiceValue } from "@/types";

/**
 * 디버깅용 유틸리티 함수들
 * 개발 환경에서 그리드를 빠르게 채우거나 초기화하는 데 사용
 */

/**
 * 모든 셀을 정답(targetValue)대로 채우기
 */
export function fillCorrect(gridState: GridState): GridState {
  const newCells = gridState.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      filledValue: cell.targetValue,
    }))
  );

  return {
    ...gridState,
    cells: newCells,
  };
}

/**
 * 모든 셀을 랜덤한 주사위 값으로 채우기
 */
export function fillRandom(gridState: GridState): GridState {
  const newCells = gridState.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      filledValue: Math.floor(Math.random() * 7) as DiceValue,
    }))
  );

  return {
    ...gridState,
    cells: newCells,
  };
}

/**
 * 지정된 비율만큼만 정답으로 채우기
 * @param percent 채울 비율 (0-100)
 */
export function fillPartial(gridState: GridState, percent: number): GridState {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const newCells = gridState.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      filledValue:
        Math.random() * 100 < clampedPercent ? cell.targetValue : null,
    }))
  );

  return {
    ...gridState,
    cells: newCells,
  };
}

/**
 * 모든 셀 비우기
 */
export function clearAll(gridState: GridState): GridState {
  const newCells = gridState.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      filledValue: null,
    }))
  );

  return {
    ...gridState,
    cells: newCells,
  };
}

/**
 * 일부 셀을 틀린 값으로 채우기 (틀린 값 표시 테스트용)
 * @param percent 틀린 값으로 채울 비율 (0-100)
 */
export function fillWithErrors(
  gridState: GridState,
  percent: number
): GridState {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const newCells = gridState.cells.map((row) =>
    row.map((cell) => {
      if (Math.random() * 100 < clampedPercent) {
        // 정답과 다른 값 생성
        let wrongValue: DiceValue;
        do {
          wrongValue = Math.floor(Math.random() * 7) as DiceValue;
        } while (wrongValue === cell.targetValue);
        return { ...cell, filledValue: wrongValue };
      }
      return { ...cell, filledValue: cell.targetValue };
    })
  );

  return {
    ...gridState,
    cells: newCells,
  };
}
