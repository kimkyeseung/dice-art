'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { GridState, DiceValue } from '@/types';
import { Dice } from './Dice';
import { NumberCell } from './NumberCell';

export type GridMode = 'fill' | 'pan';

interface GridProps {
  gridState: GridState;
  cellSize?: number;
  selectedDice: DiceValue | null;
  onCellUpdate: (row: number, col: number, value: DiceValue | null) => void;
  scale?: number; // 줌 스케일
  showMismatch?: boolean; // 틀린 값 표시
  mode?: GridMode; // 모바일 모드: 'fill' (주사위 채우기) | 'pan' (영역 이동)
  onPan?: (deltaX: number, deltaY: number) => void; // 패닝 콜백
}

const LONG_PRESS_DURATION = 500; // 길게 누르기 감지 시간 (ms)

export function Grid({ gridState, cellSize = 24, selectedDice, onCellUpdate, scale = 1, showMismatch = false, mode = 'fill', onPan }: GridProps) {
  const { cells, width, height } = gridState;
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // 셀 채우기 (좌클릭 또는 드래그)
  const fillCell = useCallback((row: number, col: number) => {
    if (selectedDice === null) return;

    const cell = cells[row]?.[col];
    if (!cell) return;

    // 이미 채워진 셀도 다른 값으로 덮어쓰기 가능
    if (cell.filledValue !== selectedDice) {
      onCellUpdate(row, col, selectedDice);
    }
  }, [selectedDice, cells, onCellUpdate]);

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
    const cell = cells[row]?.[col];
    if (!cell || cell.filledValue === null) return;

    onCellUpdate(row, col, null);
  }, [cells, onCellUpdate]);

  // 마우스 좌표에서 셀 인덱스 계산
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

  // 마우스 다운 (드래그 시작)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // 좌클릭
      setIsDragging(true);
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell) {
        fillCell(cell.row, cell.col);
        lastCellRef.current = cell;
      }
    }
  }, [getCellFromPoint, fillCell]);

  // 마우스 이동 (드래그 중)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      // 이전 셀에서 현재 셀까지 라인으로 채우기
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
  }, [isDragging, getCellFromPoint, fillCell, fillLine]);

  // 마우스 업 (드래그 종료)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastCellRef.current = null;
  }, []);

  // 마우스가 그리드를 벗어났을 때
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    lastCellRef.current = null;
  }, []);

  // 우클릭 (셀 리셋)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      resetCell(cell.row, cell.col);
    }
  }, [getCellFromPoint, resetCell]);

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

  // 그리드 밖에서 마우스를 떼도 드래그 종료되도록 window 레벨에서 리스닝
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      lastCellRef.current = null;
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // 터치 이벤트를 native로 등록 (passive: false로 preventDefault 가능하게)
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];

      // 이동 모드: 스크롤 준비
      if (mode === 'pan') {
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        return; // 기본 동작 허용하지 않음 (스크롤은 onTouchMove에서 처리)
      }

      // 채우기 모드
      e.preventDefault();
      const cell = getCellFromPoint(touch.clientX, touch.clientY);

      if (cell) {
        isLongPressRef.current = false;
        lastCellRef.current = cell;

        longPressTimerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          resetCell(cell.row, cell.col);
        }, LONG_PRESS_DURATION);

        setIsDragging(true);
        fillCell(cell.row, cell.col);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];

      // 이동 모드: 스크롤 처리
      if (mode === 'pan') {
        if (lastTouchRef.current && onPan) {
          const deltaX = touch.clientX - lastTouchRef.current.x;
          const deltaY = touch.clientY - lastTouchRef.current.y;
          onPan(deltaX, deltaY);
        }
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
        return;
      }

      // 채우기 모드
      e.preventDefault();
      cancelLongPress();

      if (isLongPressRef.current) return;

      const cell = getCellFromPoint(touch.clientX, touch.clientY);

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
    };

    const onTouchEnd = () => {
      // 이동 모드
      if (mode === 'pan') {
        lastTouchRef.current = null;
        return;
      }

      // 채우기 모드
      cancelLongPress();
      setIsDragging(false);
      lastCellRef.current = null;
      isLongPressRef.current = false;
    };

    grid.addEventListener('touchstart', onTouchStart, { passive: false });
    grid.addEventListener('touchmove', onTouchMove, { passive: false });
    grid.addEventListener('touchend', onTouchEnd);

    return () => {
      grid.removeEventListener('touchstart', onTouchStart);
      grid.removeEventListener('touchmove', onTouchMove);
      grid.removeEventListener('touchend', onTouchEnd);
    };
  }, [getCellFromPoint, fillCell, fillLine, resetCell, cancelLongPress, mode, onPan]);

  return (
    <div
      ref={gridRef}
      className={`inline-grid bg-neutral-300 gap-px p-px no-select touch-none ${mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      style={{
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
