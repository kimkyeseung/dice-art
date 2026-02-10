import { GridState, DiceValue } from '@/types';
import { DOT_POSITIONS } from './dicePositions';

/**
 * 단일 주사위를 Canvas에 그립니다.
 */
function drawDice(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: DiceValue
) {
  const radius = size * 0.15; // 모서리 라운드 (Dice.tsx와 동일: 15%)
  const dotRadius = size * 0.15; // 눈 크기 (15% 반지름 = 30% 지름, Dice.tsx와 동일)

  // 주사위 배경 (검은색, 라운드 사각형)
  ctx.fillStyle = '#171717';
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();

  // 주사위 눈 (흰색 원)
  ctx.fillStyle = '#ffffff';
  const dots = DOT_POSITIONS[value];

  for (const dot of dots) {
    // 정규화된 좌표(0-1)를 실제 좌표로 변환
    const dotX = x + dot.x * size;
    const dotY = y + dot.y * size;

    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 그리드를 Canvas에 렌더링합니다.
 */
export function renderGridToCanvas(
  gridState: GridState,
  cellSize: number = 60
): HTMLCanvasElement {
  const { cells, width, height } = gridState;

  const canvasWidth = width * cellSize;
  const canvasHeight = height * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  // 각 셀 그리기 (여백 없이 빈틈없이 배치)
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row][col];
      const x = col * cellSize;
      const y = row * cellSize;

      // 채워진 셀만 주사위로 그리기
      // filledValue가 있으면 그 값으로, 없으면 targetValue로 그리기
      const diceValue = cell.filledValue ?? cell.targetValue;
      drawDice(ctx, x, y, cellSize, diceValue);
    }
  }

  return canvas;
}

/**
 * Canvas를 이미지 파일로 다운로드합니다. (내부 함수)
 */
function downloadCanvasAsImage(
  canvas: HTMLCanvasElement,
  filename: string = 'dice-art.png'
) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * 그리드를 이미지로 내보내고 다운로드합니다.
 */
export function exportGridAsImage(
  gridState: GridState,
  cellSize: number = 60,
  filename: string = 'dice-art.png'
) {
  const canvas = renderGridToCanvas(gridState, cellSize);
  downloadCanvasAsImage(canvas, filename);
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
