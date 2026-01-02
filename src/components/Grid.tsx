'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { GridState, DiceValue } from '@/types';
import { Dice } from './Dice';
import { NumberCell } from './NumberCell';

interface GridProps {
  gridState: GridState;
  cellSize?: number;
  selectedDice: DiceValue | null;
  onCellUpdate: (row: number, col: number, value: DiceValue | null) => void;
  scale?: number; // 줌 스케일
  showMismatch?: boolean; // 틀린 값 표시
}

const LONG_PRESS_DURATION = 500; // 길게 누르기 감지 시간 (ms)

export function Grid({ gridState, cellSize = 24, selectedDice, onCellUpdate, scale = 1, showMismatch = false }: GridProps) {
  const { cells, width, height } = gridState;
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const hadValueOnStartRef = useRef(false);

  // 셀 채우기 (좌클릭 또는 드래그)
  const fillCell = useCallback((row: number, col: number) => {
    if (selectedDice === null) return;
    if (row < 0 || row >= height || col < 0 || col >= width) return;

    onCellUpdate(row, col, selectedDice);
  }, [selectedDice, height, width, onCellUpdate]);

  // 두 점 사이의 모든 셀을 채우기 (Bresenham's line algorithm)
  const fillLine = useCallback((
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ) => {
    const dx = Math.abs(toCol - fromCol);
    const dy = Math.abs(toRow - fromRow);
    const sx = fromCol < toCol ? 1 : -1;
    const sy = fromRow < toRow ? 1 : -1;
    let err = dx - dy;

    let currentRow = fromRow;
    let currentCol = fromCol;

    while (true) {
      fillCell(currentRow, currentCol);

      if (currentRow === toRow && currentCol === toCol) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentCol += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentRow += sy;
      }
    }
  }, [fillCell]);

  // 셀 리셋 (우클릭)
  const resetCell = useCallback((row: number, col: number) => {
    if (row < 0 || row >= height || col < 0 || col >= width) return;

    onCellUpdate(row, col, null);
  }, [height, width, onCellUpdate]);

  // 좌표에서 셀 인덱스 계산
  const getCellFromPoint = useCallback((clientX: number, clientY: number): { row: number; col: number } | null => {
    if (!gridRef.current) return null;

    const rect = gridRef.current.getBoundingClientRect();
    // 스케일을 고려하여 실제 좌표 계산
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;

    // gap (1px) + padding (1px) 고려
    const cellWithGap = cellSize + 1;
    const col = Math.floor((x - 1) / cellWithGap);
    const row = Math.floor((y - 1) / cellWithGap);

    if (row >= 0 && row < height && col >= 0 && col < width) {
      return { row, col };
    }
    return null;
  }, [cellSize, width, height, scale]);

  // 길게 누르기 타이머 취소
  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // 포인터 다운 (드래그 시작)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // 우클릭은 제외
    if (e.button === 2) return;

    // 포인터 캡처로 그리드 밖에서도 이벤트 받기
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    e.preventDefault();
    const cell = getCellFromPoint(e.clientX, e.clientY);

    if (cell) {
      isLongPressRef.current = false;
      lastCellRef.current = cell;

      // 터치 시작 시점에 셀이 이미 채워져 있는지 확인
      const cellData = cells[cell.row]?.[cell.col];
      hadValueOnStartRef.current = cellData?.filledValue !== null;

      // 길게 누르기 타이머 (터치에서만 의미있지만, 포인터로 통합)
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        // 터치 시작 시 이미 값이 있었던 경우에만 리셋
        if (hadValueOnStartRef.current) {
          resetCell(cell.row, cell.col);
        }
      }, LONG_PRESS_DURATION);

      setIsDragging(true);
      fillCell(cell.row, cell.col);
    }
  }, [getCellFromPoint, cells, fillCell, resetCell]);

  // 포인터 이동 (드래그 중)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    cancelLongPress();

    if (isLongPressRef.current) return;

    const cell = getCellFromPoint(e.clientX, e.clientY);

    if (cell && (
      !lastCellRef.current ||
      lastCellRef.current.row !== cell.row ||
      lastCellRef.current.col !== cell.col
    )) {
      if (lastCellRef.current) {
        fillLine(
          lastCellRef.current.row,
          lastCellRef.current.col,
          cell.row,
          cell.col
        );
      } else {
        fillCell(cell.row, cell.col);
      }
      lastCellRef.current = cell;
    }
  }, [isDragging, getCellFromPoint, fillCell, fillLine, cancelLongPress]);

  // 포인터 업 (드래그 종료)
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // 포인터 캡처 해제
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    cancelLongPress();
    setIsDragging(false);
    lastCellRef.current = null;
    isLongPressRef.current = false;
  }, [cancelLongPress]);

  // 우클릭 (셀 리셋)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      resetCell(cell.row, cell.col);
    }
  }, [getCellFromPoint, resetCell]);

  return (
    <div
      ref={gridRef}
      className="inline-grid bg-neutral-300 gap-px p-px no-select touch-none cursor-crosshair"
      style={{
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      {cells.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (cell.filledValue !== null) {
            // 주사위로 채워진 셀 - key에 filledValue 포함하여 값 변경 시 애니메이션 트리거
            const isWrong = cell.filledValue !== cell.targetValue;
            return (
              <Dice
                key={`${rowIndex}-${colIndex}-${cell.filledValue}`}
                value={cell.filledValue}
                size={cellSize}
                animate
                showWarning={showMismatch && isWrong}
              />
            );
          } else {
            // 아직 채워지지 않은 셀 (숫자 표시)
            return (
              <NumberCell
                key={`${rowIndex}-${colIndex}`}
                value={cell.targetValue}
                size={cellSize}
              />
            );
          }
        })
      )}
    </div>
  );
}

export default Grid;
