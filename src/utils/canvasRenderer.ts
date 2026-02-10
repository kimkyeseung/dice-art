import { GridState, DiceValue, CellState } from '@/types';
import { DOT_POSITIONS } from './dicePositions';

// 색상 상수
export const COLORS = {
  DICE_BG: '#171717',       // neutral-900
  DOT: '#ffffff',
  CELL_BG: '#ffffff',
  CELL_TEXT: '#262626',     // neutral-800
  GRID_BG: '#d4d4d4',       // neutral-300
  WARNING_BG: '#facc15',    // yellow-400
  WARNING_TEXT: '#713f12',  // yellow-900
} as const;

export interface DrawOptions {
  scale?: number;
  opacity?: number;
}

/**
 * 라운드 사각형을 그립니다.
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

/**
 * 단일 주사위를 Canvas에 그립니다.
 */
export function drawDice(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: DiceValue,
  options: DrawOptions = {}
) {
  const { scale = 1, opacity = 1 } = options;
  const actualSize = size * scale;
  const offset = (size - actualSize) / 2;
  const drawX = x + offset;
  const drawY = y + offset;

  const radius = actualSize * 0.15;
  const dotRadius = actualSize * 0.15; // 30% 지름 = 15% 반지름

  ctx.save();
  ctx.globalAlpha = opacity;

  // 주사위 배경 (검은색, 라운드 사각형)
  ctx.fillStyle = COLORS.DICE_BG;
  drawRoundRect(ctx, drawX, drawY, actualSize, actualSize, radius);

  // 주사위 눈 (흰색 원)
  ctx.fillStyle = COLORS.DOT;
  const dots = DOT_POSITIONS[value];

  for (const dot of dots) {
    const dotX = drawX + dot.x * actualSize;
    const dotY = drawY + dot.y * actualSize;

    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 경고 아이콘을 그립니다 (틀린 값 표시).
 */
export function drawWarningIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  const warningSize = Math.max(Math.round(size * 0.3), 8);
  const iconX = x + size - warningSize * 0.75;
  const iconY = y - warningSize * 0.25;

  ctx.save();

  // 노란 원
  ctx.fillStyle = COLORS.WARNING_BG;
  ctx.beginPath();
  ctx.arc(iconX + warningSize / 2, iconY + warningSize / 2, warningSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // 느낌표
  ctx.fillStyle = COLORS.WARNING_TEXT;
  ctx.font = `bold ${warningSize * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', iconX + warningSize / 2, iconY + warningSize / 2);

  ctx.restore();
}

/**
 * 숫자 셀을 Canvas에 그립니다.
 */
export function drawNumberCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: DiceValue
) {
  const fontSize = Math.max(Math.round(size * 0.4), 12);

  // 흰색 배경
  ctx.fillStyle = COLORS.CELL_BG;
  ctx.fillRect(x, y, size, size);

  // 숫자
  ctx.fillStyle = COLORS.CELL_TEXT;
  ctx.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x + size / 2, y + size / 2);
}

/**
 * 단일 셀을 Canvas에 그립니다.
 */
export function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  cell: CellState,
  showMismatch: boolean = false,
  options: DrawOptions = {}
) {
  if (cell.filledValue !== null) {
    // 채워진 셀: 주사위로 그리기
    drawDice(ctx, x, y, size, cell.filledValue, options);

    // 틀린 값 경고 표시
    if (showMismatch && cell.filledValue !== cell.targetValue) {
      drawWarningIcon(ctx, x, y, size);
    }
  } else {
    // 빈 셀: 숫자로 그리기
    drawNumberCell(ctx, x, y, size, cell.targetValue);
  }
}

export interface RenderGridOptions {
  cellSize?: number;
  gap?: number;
  padding?: number;
  showMismatch?: boolean;
}

/**
 * 전체 그리드를 Canvas에 렌더링합니다.
 */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  gridState: GridState,
  options: RenderGridOptions = {}
) {
  const {
    cellSize = 24,
    gap = 1,
    padding = 1,
    showMismatch = false,
  } = options;

  const { cells, width, height } = gridState;
  const canvasWidth = padding * 2 + width * cellSize + (width - 1) * gap;
  const canvasHeight = padding * 2 + height * cellSize + (height - 1) * gap;

  // 배경
  ctx.fillStyle = COLORS.GRID_BG;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 각 셀 그리기
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row][col];
      const x = padding + col * (cellSize + gap);
      const y = padding + row * (cellSize + gap);

      drawCell(ctx, x, y, cellSize, cell, showMismatch);
    }
  }
}

/**
 * 특정 셀만 다시 그립니다 (Dirty Rectangle 기법).
 */
export function renderCellAt(
  ctx: CanvasRenderingContext2D,
  gridState: GridState,
  row: number,
  col: number,
  options: RenderGridOptions = {},
  animationOptions: DrawOptions = {}
) {
  const {
    cellSize = 24,
    gap = 1,
    padding = 1,
    showMismatch = false,
  } = options;

  const cell = gridState.cells[row]?.[col];
  if (!cell) return;

  const x = padding + col * (cellSize + gap);
  const y = padding + row * (cellSize + gap);

  // 해당 셀 영역 클리어 (gap 포함)
  ctx.fillStyle = COLORS.GRID_BG;
  ctx.fillRect(x, y, cellSize, cellSize);

  // 셀 다시 그리기
  drawCell(ctx, x, y, cellSize, cell, showMismatch, animationOptions);
}

/**
 * 특정 셀을 주어진 값으로 직접 그립니다 (상태 업데이트 전에 즉시 렌더링).
 */
export function renderCellDirect(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  filledValue: DiceValue | null,
  targetValue: DiceValue,
  options: RenderGridOptions = {},
  animationOptions: DrawOptions = {}
) {
  const {
    cellSize = 24,
    gap = 1,
    padding = 1,
    showMismatch = false,
  } = options;

  const x = padding + col * (cellSize + gap);
  const y = padding + row * (cellSize + gap);

  // 애니메이션 중(scale > 1)일 때만 더 큰 영역 클리어
  const isAnimating = animationOptions.scale && animationOptions.scale > 1;
  const clearMargin = isAnimating ? Math.ceil(cellSize * 0.1) : 0;

  ctx.fillStyle = COLORS.GRID_BG;
  ctx.fillRect(
    x - clearMargin,
    y - clearMargin,
    cellSize + clearMargin * 2,
    cellSize + clearMargin * 2
  );

  // 셀 그리기
  const cell: CellState = { filledValue, targetValue };
  drawCell(ctx, x, y, cellSize, cell, showMismatch, animationOptions);
}

/**
 * Canvas 크기를 계산합니다.
 */
export function calculateCanvasSize(
  gridWidth: number,
  gridHeight: number,
  cellSize: number = 24,
  gap: number = 1,
  padding: number = 1
): { width: number; height: number } {
  return {
    width: padding * 2 + gridWidth * cellSize + (gridWidth - 1) * gap,
    height: padding * 2 + gridHeight * cellSize + (gridHeight - 1) * gap,
  };
}

/**
 * Canvas 좌표에서 셀 인덱스를 계산합니다.
 */
export function getCellFromPoint(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number,
  cellSize: number = 24,
  gap: number = 1,
  padding: number = 1
): { row: number; col: number } | null {
  const cellWithGap = cellSize + gap;
  const col = Math.floor((x - padding) / cellWithGap);
  const row = Math.floor((y - padding) / cellWithGap);

  // 범위 체크
  if (col < 0 || col >= gridWidth || row < 0 || row >= gridHeight) {
    return null;
  }

  // gap 영역 체크 (gap 위 클릭 무시)
  const cellX = (x - padding) % cellWithGap;
  const cellY = (y - padding) % cellWithGap;
  if (cellX >= cellSize || cellY >= cellSize) {
    return null;
  }

  return { row, col };
}
