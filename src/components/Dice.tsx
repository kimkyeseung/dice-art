'use client';

import { memo } from 'react';
import { DiceValue } from '@/types';

interface DiceProps {
  value: DiceValue;
  size?: number;
  className?: string;
  animate?: boolean;
  showWarning?: boolean; // 틀린 값 경고 표시
}

// 주사위 눈의 위치 정의
// 3x3 그리드 기준: tl=top-left, tc=top-center, tr=top-right, ml=middle-left, mc=middle-center, mr=middle-right, bl=bottom-left, bc=bottom-center, br=bottom-right
// 6의 경우 가로 간격을 좁혀서 배치 (6l, 6r 사용)
const dotPositions: Record<DiceValue, string[]> = {
  0: [], // 빈 면 (눈 없음)
  1: ['mc'],
  2: ['tr', 'bl'],
  3: ['tr', 'mc', 'bl'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'mc', 'bl', 'br'],
  6: ['t6l', 'm6l', 'b6l', 't6r', 'm6r', 'b6r'],
};

// 위치별 CSS 클래스 (베젤을 최소화하여 눈을 더 바깥쪽에 배치)
const positionClasses: Record<string, string> = {
  tl: 'top-[10%] left-[10%]',
  tc: 'top-[10%] left-1/2 -translate-x-1/2',
  tr: 'top-[10%] right-[10%]',
  ml: 'top-1/2 left-[10%] -translate-y-1/2',
  mc: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  mr: 'top-1/2 right-[10%] -translate-y-1/2',
  bl: 'bottom-[10%] left-[10%]',
  bc: 'bottom-[10%] left-1/2 -translate-x-1/2',
  br: 'bottom-[10%] right-[10%]',
  // 6 주사위 전용 (가로 간격 좁힘: left 15%, right 15%, 세로 간격 벌림: 7%)
  t6l: 'top-[7%] left-[15%]',
  t6r: 'top-[7%] right-[15%]',
  m6l: 'top-1/2 left-[15%] -translate-y-1/2',
  m6r: 'top-1/2 right-[15%] -translate-y-1/2',
  b6l: 'bottom-[7%] left-[15%]',
  b6r: 'bottom-[7%] right-[15%]',
};

export const Dice = memo(function Dice({ value, size = 40, className = '', animate = false, showWarning = false }: DiceProps) {
  const dots = dotPositions[value];
  // 주사위 크기에 비례한 눈 크기 (약 30% - 실제 주사위처럼 크게)
  const dotSize = Math.max(Math.round(size * 0.30), 6);
  // 라운드 비율 (베젤 최소화를 위해 15%로 줄임)
  const borderRadius = Math.round(size * 0.15);
  // 경고 아이콘 크기 (주사위 크기의 30%)
  const warningSize = Math.max(Math.round(size * 0.3), 8);

  return (
    <div
      className={`relative bg-neutral-900 shadow-md ${className} ${animate ? 'animate-dice-pop' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        // 실제 주사위처럼 약간의 입체감
        boxShadow: `
          inset 1px 1px 2px rgba(255,255,255,0.1),
          inset -1px -1px 2px rgba(0,0,0,0.3),
          0 2px 4px rgba(0,0,0,0.3)
        `,
      }}
    >
      {dots.map((pos, index) => (
        <div
          key={index}
          className={`absolute rounded-full bg-white ${positionClasses[pos]}`}
          style={{
            width: dotSize,
            height: dotSize,
            // 눈에 약간의 입체감
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          }}
        />
      ))}
      {/* 틀린 값 경고 표시 */}
      {showWarning && (
        <div
          className="absolute flex items-center justify-center bg-yellow-400 text-yellow-900 font-bold rounded-full shadow-sm"
          style={{
            width: warningSize,
            height: warningSize,
            fontSize: warningSize * 0.7,
            top: -warningSize * 0.25,
            right: -warningSize * 0.25,
            lineHeight: 1,
          }}
        >
          !
        </div>
      )}
    </div>
  );
});

export default Dice;
