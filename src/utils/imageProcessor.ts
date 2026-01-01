import { DiceValue, GridState, CellState } from '@/types';

// 그리드 크기 설정
const MIN_GRID_SIZE = 10; // 최소 셀 개수
const MAX_GRID_SIZE = 100; // 최대 셀 개수 (한 축 기준)
const DEFAULT_CELL_COUNT = 50; // 기본 긴 쪽 셀 개수

interface GridDimensions {
  width: number;
  height: number;
}

/**
 * 이미지 비율에 맞는 그리드 크기를 계산합니다.
 * 긴 쪽을 기준으로 셀 개수를 정하고, 비율을 유지합니다.
 */
export function calculateGridDimensions(
  imageWidth: number,
  imageHeight: number,
  maxCells: number = DEFAULT_CELL_COUNT
): GridDimensions {
  const aspectRatio = imageWidth / imageHeight;

  let gridWidth: number;
  let gridHeight: number;

  if (aspectRatio >= 1) {
    // 가로가 더 긴 경우
    gridWidth = Math.min(Math.max(maxCells, MIN_GRID_SIZE), MAX_GRID_SIZE);
    gridHeight = Math.round(gridWidth / aspectRatio);
  } else {
    // 세로가 더 긴 경우
    gridHeight = Math.min(Math.max(maxCells, MIN_GRID_SIZE), MAX_GRID_SIZE);
    gridWidth = Math.round(gridHeight * aspectRatio);
  }

  // 최소 크기 보장
  gridWidth = Math.max(gridWidth, MIN_GRID_SIZE);
  gridHeight = Math.max(gridHeight, MIN_GRID_SIZE);

  return { width: gridWidth, height: gridHeight };
}

/**
 * 밝기 값(0-255)을 주사위 값(1-6)으로 변환합니다.
 * 1 = 가장 어두움 (0-42)
 * 6 = 가장 밝음 (213-255)
 */
export function brightnessToJDiceValue(brightness: number): DiceValue {
  // 0-255를 1-6으로 매핑
  // 밝을수록 높은 숫자 (주사위 눈이 많을수록 밝음)
  const normalized = Math.min(255, Math.max(0, brightness));
  const value = Math.ceil((normalized / 255) * 6);
  return Math.max(1, Math.min(6, value)) as DiceValue;
}

/**
 * RGB 값에서 밝기(휘도)를 계산합니다.
 * ITU-R BT.601 표준 사용
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 이미지를 분석하여 그리드 상태를 생성합니다.
 */
export function processImage(
  image: HTMLImageElement,
  maxCells: number = DEFAULT_CELL_COUNT
): GridState {
  // 캔버스 생성
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  // 그리드 크기 계산
  const dimensions = calculateGridDimensions(image.width, image.height, maxCells);
  const { width: gridWidth, height: gridHeight } = dimensions;

  // 캔버스를 그리드 크기로 설정 (각 셀이 1픽셀)
  canvas.width = gridWidth;
  canvas.height = gridHeight;

  // 이미지를 그리드 크기로 축소하여 그리기
  ctx.drawImage(image, 0, 0, gridWidth, gridHeight);

  // 픽셀 데이터 가져오기
  const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight);
  const pixels = imageData.data;

  // 그리드 생성
  const cells: CellState[][] = [];

  for (let y = 0; y < gridHeight; y++) {
    const row: CellState[] = [];
    for (let x = 0; x < gridWidth; x++) {
      const index = (y * gridWidth + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];

      const brightness = calculateLuminance(r, g, b);
      const diceValue = brightnessToJDiceValue(brightness);

      row.push({
        targetValue: diceValue,
        filledValue: null,
      });
    }
    cells.push(row);
  }

  return {
    cells,
    width: gridWidth,
    height: gridHeight,
  };
}

/**
 * 그리드의 진행률을 계산합니다 (0-100%)
 */
export function calculateProgress(gridState: GridState): number {
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
 * 모든 셀이 채워졌는지 확인합니다.
 */
export function isGridComplete(gridState: GridState): boolean {
  for (const row of gridState.cells) {
    for (const cell of row) {
      if (cell.filledValue === null) {
        return false;
      }
    }
  }
  return true;
}
