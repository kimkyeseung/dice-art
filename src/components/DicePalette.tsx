'use client';

import { DiceValue } from '@/types';
import { Dice } from './Dice';

// 지우개와 패닝을 포함한 선택 가능한 값
export type PaletteValue = DiceValue | 'eraser' | 'pan';

interface DicePaletteProps {
  selectedValue: PaletteValue | null;
  onSelect: (value: PaletteValue) => void;
  hidden?: boolean; // 팔레트 숨김 (이동 모드 등)
}

// 모바일용 2줄 배치: 윗줄 [0,1,2,3], 아랫줄 [4,5,6,eraser]
const topRowValues: DiceValue[] = [0, 1, 2, 3];
const bottomRowValues: DiceValue[] = [4, 5, 6];
const allValues: DiceValue[] = [0, 1, 2, 3, 4, 5, 6];

export function DicePalette({ selectedValue, onSelect, hidden = false }: DicePaletteProps) {
  if (hidden) {
    return null;
  }

  const renderDiceButton = (value: DiceValue) => (
    <button
      key={value}
      data-testid={`dice-button-${value}`}
      onClick={() => onSelect(value)}
      className={`
        p-0.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-150
        hover:bg-neutral-200 hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-blue-400
        active:scale-95
        ${selectedValue === value
          ? 'bg-blue-100 ring-2 ring-blue-500 scale-105 sm:scale-110'
          : 'bg-transparent'
        }
      `}
      title={`주사위 ${value} 선택 (단축키: ${value})`}
    >
      {/* 모바일: 36px, 데스크탑: 48px */}
      <div className="sm:hidden">
        <Dice value={value} size={36} />
      </div>
      <div className="hidden sm:block">
        <Dice value={value} size={48} />
      </div>
    </button>
  );

  const renderToolButton = (tool: 'eraser' | 'pan') => {
    const isEraser = tool === 'eraser';

    const renderIcon = (iconSize: number) => {
      const borderRadius = Math.round(iconSize * 0.15);
      const svgSize = Math.round(iconSize * 0.58);

      return (
        <div
          className="relative bg-neutral-900 flex items-center justify-center"
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: borderRadius,
            boxShadow: `
              inset 1px 1px 2px rgba(255,255,255,0.1),
              inset -1px -1px 2px rgba(0,0,0,0.3),
              0 2px 4px rgba(0,0,0,0.3)
            `,
          }}
        >
          {isEraser ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={svgSize}
              height={svgSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="m5 11 9 9" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={svgSize}
              height={svgSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
              <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          )}
        </div>
      );
    };

    return (
      <button
        key={tool}
        data-testid={`dice-button-${tool}`}
        onClick={() => onSelect(tool)}
        className={`
          p-0.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-150
          hover:bg-neutral-200 hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-blue-400
          active:scale-95
          ${selectedValue === tool
            ? 'bg-blue-100 ring-2 ring-blue-500 scale-105 sm:scale-110'
            : 'bg-transparent'
          }
        `}
        title={isEraser ? '지우개 (단축키: E)' : '이동 모드 (단축키: P)'}
      >
        {/* 모바일: 36px, 데스크탑: 48px */}
        <div className="sm:hidden">
          {renderIcon(36)}
        </div>
        <div className="hidden sm:block">
          {renderIcon(48)}
        </div>
      </button>
    );
  };

  return (
    <fieldset className="border-2 border-neutral-300 rounded-lg p-2 sm:p-4 bg-neutral-100/95 backdrop-blur-sm">
      <legend className="px-2 text-xs sm:text-sm font-medium text-neutral-600 pointer-events-none">
        주사위 선택
      </legend>
      {/* 모바일: 2줄 배치 (5+4) - 9개 버튼 */}
      <div className="sm:hidden flex flex-col gap-0.5 items-center">
        <div className="flex gap-0.5 items-center justify-center">
          {[0, 1, 2, 3, 4].map(v => renderDiceButton(v as DiceValue))}
        </div>
        <div className="flex gap-0.5 items-center justify-center">
          {[5, 6].map(v => renderDiceButton(v as DiceValue))}
          {renderToolButton('eraser')}
          {renderToolButton('pan')}
        </div>
      </div>
      {/* 데스크탑: 1줄 배치 */}
      <div className="hidden sm:flex gap-3 items-center justify-center">
        {allValues.map(renderDiceButton)}
        {renderToolButton('eraser')}
      </div>
      <p className="text-xs text-neutral-500 text-center mt-1.5 sm:mt-2 hidden sm:block">
        키보드 0-6, E(지우개)로 선택할 수 있습니다
      </p>
    </fieldset>
  );
}

export default DicePalette;
