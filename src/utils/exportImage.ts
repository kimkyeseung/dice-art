import { GridState, DiceValue } from '@/types';

// 주사위 눈의 위치 정의 (정규화된 좌표, 0-1 범위)
// 베젤을 최소화하여 눈을 더 바깥쪽에 배치 (0.12, 0.88)
// 6 주사위는 가로 간격 좁힘 (x: 0.17, 0.83)
const dotPositions: Record<DiceValue, { x: number; y: number }[]> = {
  0: [], // 빈 면 (눈 없음)
  1: [{ x: 0.5, y: 0.5 }],
  2: [{ x: 0.88, y: 0.12 }, { x: 0.12, y: 0.88 }],
  3: [{ x: 0.88, y: 0.12 }, { x: 0.5, y: 0.5 }, { x: 0.12, y: 0.88 }],
  4: [{ x: 0.12, y: 0.12 }, { x: 0.88, y: 0.12 }, { x: 0.12, y: 0.88 }, { x: 0.88, y: 0.88 }],
  5: [{ x: 0.12, y: 0.12 }, { x: 0.88, y: 0.12 }, { x: 0.5, y: 0.5 }, { x: 0.12, y: 0.88 }, { x: 0.88, y: 0.88 }],
  6: [{ x: 0.17, y: 0.09 }, { x: 0.17, y: 0.5 }, { x: 0.17, y: 0.91 }, { x: 0.83, y: 0.09 }, { x: 0.83, y: 0.5 }, { x: 0.83, y: 0.91 }],
};

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
  const radius = size * 0.15; // 모서리 라운드 (15%로 줄임)
  const dotRadius = size * 0.15; // 눈 크기 (15% 반지름 = 30% 지름, Dice.tsx와 동일)
  const padding = size * 0.02; // 눈 위치 패딩 (최소화)

  // 주사위 배경 (검은색, 라운드 사각형)
  ctx.fillStyle = '#171717';
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();

  // 주사위 눈 (흰색 원)
  ctx.fillStyle = '#ffffff';
  const dots = dotPositions[value];
  const innerSize = size - padding * 2;

  for (const dot of dots) {
    const dotX = x + padding + dot.x * innerSize;
    const dotY = y + padding + dot.y * innerSize;

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
  const gap = 2; // 셀 간격
  const padding = 4; // 전체 패딩

  const canvasWidth = padding * 2 + width * cellSize + (width - 1) * gap;
  const canvasHeight = padding * 2 + height * cellSize + (height - 1) * gap;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  // 배경 (연한 회색)
  ctx.fillStyle = '#d4d4d4';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 각 셀 그리기
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row][col];
      const x = padding + col * (cellSize + gap);
      const y = padding + row * (cellSize + gap);

      // 채워진 셀만 주사위로 그리기
      // filledValue가 있으면 그 값으로, 없으면 targetValue로 그리기
      const diceValue = cell.filledValue ?? cell.targetValue;
      drawDice(ctx, x, y, cellSize, diceValue);
    }
  }

  return canvas;
}

/**
 * Canvas를 이미지 파일로 다운로드합니다.
 */
export function downloadCanvasAsImage(
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
