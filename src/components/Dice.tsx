'use client';

import { DiceValue } from '@/types';

interface DiceProps {
  value: DiceValue;
  size?: number;
  className?: string;
  animate?: boolean;
}

// 주사위 눈의 위치 정의
// 3x3 그리드 기준: tl=top-left, tc=top-center, tr=top-right, ml=middle-left, mc=middle-center, mr=middle-right, bl=bottom-left, bc=bottom-center, br=bottom-right
const dotPositions: Record<DiceValue, string[]> = {
  0: [], // 빈 면 (눈 없음)
  1: ['mc'],
  2: ['tr', 'bl'],
  3: ['tr', 'mc', 'bl'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'mc', 'bl', 'br'],
  6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'],
};

// 위치별 CSS 클래스
const positionClasses: Record<string, string> = {
  tl: 'top-[18%] left-[18%]',
  tc: 'top-[18%] left-1/2 -translate-x-1/2',
  tr: 'top-[18%] right-[18%]',
  ml: 'top-1/2 left-[18%] -translate-y-1/2',
  mc: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  mr: 'top-1/2 right-[18%] -translate-y-1/2',
  bl: 'bottom-[18%] left-[18%]',
  bc: 'bottom-[18%] left-1/2 -translate-x-1/2',
  br: 'bottom-[18%] right-[18%]',
};

export function Dice({ value, size = 40, className = '', animate = false }: DiceProps) {
  const dots = dotPositions[value];
  // 주사위 크기에 비례한 눈 크기 (약 18%)
  const dotSize = Math.max(Math.round(size * 0.18), 4);
  // 라운드 비율 (실제 주사위처럼 약 20%)
  const borderRadius = Math.round(size * 0.2);

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
    </div>
  );
}

export default Dice;
