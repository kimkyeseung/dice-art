'use client';

import { useEffect, useRef } from 'react';
import { GridState, DiceValue } from '@/types';
import { calculateProgress } from '@/utils/imageProcessor';

interface ProgressPreviewDialogProps {
  gridState: GridState;
  onClose: () => void;
}

// 주사위 눈의 위치 정의 (정규화된 좌표, 0-1 범위)
// Dice.tsx와 일치: CSS에서 top/left 10%에 눈 배치, 눈 크기 30%이므로 중심은 25%
// 반대편은 1 - 0.25 = 0.75 (right/bottom 10% + 눈 크기 반 15%)
const dotPositions: Record<DiceValue, { x: number; y: number }[]> = {
  0: [],
  1: [{ x: 0.5, y: 0.5 }],
  2: [{ x: 0.75, y: 0.25 }, { x: 0.25, y: 0.75 }],
  3: [{ x: 0.75, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.25, y: 0.75 }],
  4: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }],
  5: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }],
  // 6 주사위: Dice.tsx에서 left 15%, right 15%, top 7%, bottom 7% + 눈 크기 반 15%
  6: [{ x: 0.30, y: 0.22 }, { x: 0.30, y: 0.5 }, { x: 0.30, y: 0.78 }, { x: 0.70, y: 0.22 }, { x: 0.70, y: 0.5 }, { x: 0.70, y: 0.78 }],
};

function drawDice(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: DiceValue
) {
  const dotRadius = size * 0.15; // 눈 크기 (15% 반지름 = 30% 지름, Dice.tsx와 동일)

  // 배경은 이미 검은색으로 채워져 있으므로 생략
  // 주사위 눈만 그리기
  ctx.fillStyle = '#ffffff';
  const dots = dotPositions[value];

  for (const dot of dots) {
    // 정규화된 좌표(0-1)를 실제 좌표로 변환
    const dotX = x + dot.x * size;
    const dotY = y + dot.y * size;

    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function ProgressPreviewDialog({ gridState, onClose }: ProgressPreviewDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progress = calculateProgress(gridState);

  // 채워진 셀과 전체 셀 수 계산
  const totalCells = gridState.width * gridState.height;
  const filledCells = gridState.cells.flat().filter(cell => cell.filledValue !== null).length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cells, width, height } = gridState;

    // 최대 크기 계산 (모바일 고려)
    const maxSize = Math.min(window.innerWidth - 64, window.innerHeight - 200, 500);
    const cellSize = Math.floor(maxSize / Math.max(width, height));

    // 격자 없이 셀만 빈틈없이 배치
    const canvasWidth = width * cellSize;
    const canvasHeight = height * cellSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 배경 (검은색 - 주사위 배경색과 동일)
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 각 셀 그리기
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const cell = cells[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        if (cell.filledValue !== null) {
          // 채워진 셀: 주사위로 그리기
          drawDice(ctx, x, y, cellSize, cell.filledValue);
        } else {
          // 채워지지 않은 셀: 흰색 배경 + 격자선
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, cellSize, cellSize);

          // 격자선 (왼쪽, 윗쪽 테두리만 - 1px)
          ctx.strokeStyle = '#d4d4d4';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // 왼쪽 선
          ctx.moveTo(x + 0.5, y);
          ctx.lineTo(x + 0.5, y + cellSize);
          // 윗쪽 선
          ctx.moveTo(x, y + 0.5);
          ctx.lineTo(x + cellSize, y + 0.5);
          ctx.stroke();
        }
      }
    }
  }, [gridState]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-800">진행 상황</h2>
            <p className="text-sm text-neutral-500">
              {filledCells.toLocaleString()} / {totalCells.toLocaleString()}칸 완료
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
              {progress}%
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="px-4 pt-3 pb-2">
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 캔버스 */}
        <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-neutral-50">
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-inner"
          />
        </div>

        {/* 범례 */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-center gap-6 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-900" />
            <span>채워진 칸</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-neutral-300" />
            <span>남은 칸</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressPreviewDialog;
