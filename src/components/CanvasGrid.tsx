'use client';

import { useCallback, useRef, useState, useEffect, useMemo, memo } from 'react';
import { GridState, DiceValue } from '@/types';
import {
  renderGrid,
  renderCellDirect,
  calculateCanvasSize,
  getCellFromPoint as getCellFromCanvasPoint,
} from '@/utils/canvasRenderer';
import type { PaletteValue } from './DicePalette';

interface CanvasGridProps {
  gridState: GridState;
  cellSize?: number;
  selectedDice: PaletteValue | null;
  onCellUpdate: (row: number, col: number, value: DiceValue | null) => void;
  scale?: number;
  showMismatch?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  rowOffset?: number;
  colOffset?: number;
}

const LONG_PRESS_DURATION = 500;
const GAP = 1;
const PADDING = 1;
const ANIMATION_DURATION = 150;

interface DiceAnimation {
  row: number;
  col: number;
  value: DiceValue;
  startTime: number;
}

function getAnimationState(progress: number): { scale: number; opacity: number } {
  if (progress < 0.5) {
    const t = progress * 2;
    return {
      scale: 0.8 + t * 0.3,
      opacity: 0.5 + t * 0.5,
    };
  } else {
    const t = (progress - 0.5) * 2;
    return {
      scale: 1.1 - t * 0.1,
      opacity: 1,
    };
  }
}

export const CanvasGrid = memo(function CanvasGrid({
  gridState,
  cellSize = 24,
  selectedDice,
  onCellUpdate,
  scale = 1,
  showMismatch = false,
  scrollContainerRef,
  rowOffset = 0,
  colOffset = 0,
}: CanvasGridProps) {
  const { width, height } = gridState;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationsRef = useRef<Map<string, DiceAnimation>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Refs for latest values (avoid stale closures)
  const gridStateRef = useRef(gridState);
  const selectedDiceRef = useRef(selectedDice);
  const showMismatchRef = useRef(showMismatch);

  // Update refs when props change
  useEffect(() => { gridStateRef.current = gridState; }, [gridState]);
  useEffect(() => { selectedDiceRef.current = selectedDice; }, [selectedDice]);
  useEffect(() => { showMismatchRef.current = showMismatch; }, [showMismatch]);

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const hadValueOnStartRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

  const isPanMode = selectedDice === 'pan';

  const canvasSize = calculateCanvasSize(width, height, cellSize, GAP, PADDING);

  const renderOptions = useMemo(() => ({
    cellSize,
    gap: GAP,
    padding: PADDING,
    showMismatch,
  }), [cellSize, showMismatch]);

  // Full grid render
  const renderFullGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGrid(ctx, gridStateRef.current, renderOptions);
  }, [renderOptions]);

  // Render single cell immediately
  const renderCell = useCallback((row: number, col: number, value: DiceValue | null, animOpts?: { scale: number; opacity: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cells = gridStateRef.current.cells;
    const cell = cells[row]?.[col];
    if (!cell) return;

    const opts = {
      cellSize,
      gap: GAP,
      padding: PADDING,
      showMismatch: showMismatchRef.current,
    };

    // 메인 셀 그리기
    renderCellDirect(ctx, row, col, value, cell.targetValue, opts, animOpts);

    // 애니메이션 중(scale > 1)일 때만 인접 셀 복구
    if (animOpts?.scale && animOpts.scale > 1) {
      const adjacent = [
        [row - 1, col], [row + 1, col],
        [row, col - 1], [row, col + 1],
      ];
      for (const [r, c] of adjacent) {
        const adjCell = cells[r]?.[c];
        if (adjCell) {
          renderCellDirect(ctx, r, c, adjCell.filledValue, adjCell.targetValue, opts);
        }
      }
    }
  }, [cellSize]);

  // Animation loop
  const runAnimationLoop = useCallback(() => {
    const now = performance.now();
    const animations = animationsRef.current;
    let hasActiveAnimations = false;

    animations.forEach((anim, key) => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      if (progress < 1) {
        hasActiveAnimations = true;
        const animState = getAnimationState(progress);
        renderCell(anim.row, anim.col, anim.value, animState);
      } else {
        renderCell(anim.row, anim.col, anim.value);
        animations.delete(key);
      }
    });

    if (hasActiveAnimations) {
      animationFrameRef.current = requestAnimationFrame(runAnimationLoop);
    } else {
      animationFrameRef.current = null;
    }
  }, [renderCell]);

  // Start animation
  const startAnimation = useCallback((row: number, col: number, value: DiceValue) => {
    const key = `${row}-${col}`;
    animationsRef.current.set(key, { row, col, value, startTime: performance.now() });

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(runAnimationLoop);
    }
  }, [runAnimationLoop]);

  // Initial render and re-render on gridState change
  useEffect(() => {
    renderFullGrid();
  }, [gridState, renderFullGrid]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Get cell from pointer coordinates
  const getCellFromPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    return getCellFromCanvasPoint(x, y, width, height, cellSize, GAP, PADDING);
  }, [width, height, cellSize, scale]);

  // Fill cell (uses refs for latest state)
  const fillCell = useCallback((row: number, col: number, skipFilled: boolean = false) => {
    const dice = selectedDiceRef.current;
    if (dice === null || dice === 'pan') return;
    if (row < 0 || row >= height || col < 0 || col >= width) return;

    const cells = gridStateRef.current.cells;
    if (skipFilled && dice !== 'eraser') {
      if (cells[row]?.[col]?.filledValue !== null) return;
    }

    const globalRow = row + rowOffset;
    const globalCol = col + colOffset;

    if (dice === 'eraser') {
      renderCell(row, col, null);
      onCellUpdate(globalRow, globalCol, null);
    } else {
      renderCell(row, col, dice);
      startAnimation(row, col, dice);
      onCellUpdate(globalRow, globalCol, dice);
    }
  }, [height, width, rowOffset, colOffset, renderCell, startAnimation, onCellUpdate]);

  // Bresenham line
  const fillLine = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const dx = Math.abs(toCol - fromCol);
    const dy = Math.abs(toRow - fromRow);
    const sx = fromCol < toCol ? 1 : -1;
    const sy = fromRow < toRow ? 1 : -1;
    let err = dx - dy;
    let currentRow = fromRow;
    let currentCol = fromCol;

    while (true) {
      fillCell(currentRow, currentCol, true);
      if (currentRow === toRow && currentCol === toCol) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; currentCol += sx; }
      if (e2 < dx) { err += dx; currentRow += sy; }
    }
  }, [fillCell]);

  // Reset cell
  const resetCell = useCallback((row: number, col: number) => {
    if (row < 0 || row >= height || col < 0 || col >= width) return;
    renderCell(row, col, null);
    onCellUpdate(row + rowOffset, col + colOffset, null);
  }, [height, width, rowOffset, colOffset, renderCell, onCellUpdate]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (selectedDiceRef.current === 'pan') {
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = true;
      setIsDragging(true);
      return;
    }

    e.preventDefault();
    const cell = getCellFromPoint(e.clientX, e.clientY);

    if (cell) {
      isLongPressRef.current = false;
      lastCellRef.current = cell;

      const cellData = gridStateRef.current.cells[cell.row]?.[cell.col];
      hadValueOnStartRef.current = cellData?.filledValue !== null;

      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        if (hadValueOnStartRef.current) {
          resetCell(cell.row, cell.col);
        }
      }, LONG_PRESS_DURATION);

      isDraggingRef.current = true;
      setIsDragging(true);
      fillCell(cell.row, cell.col);
    }
  }, [getCellFromPoint, fillCell, resetCell]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    if (selectedDiceRef.current === 'pan' && lastPanPointRef.current && scrollContainerRef?.current) {
      const deltaX = e.clientX - lastPanPointRef.current.x;
      const deltaY = e.clientY - lastPanPointRef.current.y;
      scrollContainerRef.current.scrollLeft -= deltaX;
      scrollContainerRef.current.scrollTop -= deltaY;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    cancelLongPress();
    if (isLongPressRef.current) return;

    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell && (!lastCellRef.current || lastCellRef.current.row !== cell.row || lastCellRef.current.col !== cell.col)) {
      if (lastCellRef.current) {
        fillLine(lastCellRef.current.row, lastCellRef.current.col, cell.row, cell.col);
      } else {
        fillCell(cell.row, cell.col, true);
      }
      lastCellRef.current = cell;
    }
  }, [getCellFromPoint, fillCell, fillLine, cancelLongPress, scrollContainerRef]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    cancelLongPress();
    isDraggingRef.current = false;
    setIsDragging(false);
    lastCellRef.current = null;
    lastPanPointRef.current = null;
    isLongPressRef.current = false;
  }, [cancelLongPress]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) resetCell(cell.row, cell.col);
  }, [getCellFromPoint, resetCell]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="canvas-grid"
      width={canvasSize.width}
      height={canvasSize.height}
      className={`touch-none ${isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleContextMenu}
    />
  );
});

export default CanvasGrid;
