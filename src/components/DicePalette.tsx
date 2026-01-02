'use client';

import { DiceValue } from '@/types';
import { Dice } from './Dice';

// 지우개를 포함한 선택 가능한 값
export type PaletteValue = DiceValue | 'eraser';

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
        p-1 sm:p-2 rounded-lg transition-all duration-150
        hover:bg-neutral-200 hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-blue-400
        active:scale-95
        ${selectedValue === value
          ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
          : 'bg-transparent'
        }
      `}
      title={`주사위 ${value} 선택 (단축키: ${value})`}
    >
      <div className="scale-75 sm:scale-100">
        <Dice value={value} size={48} />
      </div>
    </button>
  );

  const renderEraserButton = () => {
    const size = 48;
    const borderRadius = Math.round(size * 0.15);

    return (
      <button
        key="eraser"
        data-testid="dice-button-eraser"
        onClick={() => onSelect('eraser')}
        className={`
          p-1 sm:p-2 rounded-lg transition-all duration-150
          hover:bg-neutral-200 hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-blue-400
          active:scale-95
          ${selectedValue === 'eraser'
            ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
            : 'bg-transparent'
          }
        `}
        title="지우개 (단축키: E)"
      >
        <div className="scale-75 sm:scale-100">
          {/* 주사위와 동일한 스타일의 박스 */}
          <div
            className="relative bg-neutral-900 flex items-center justify-center"
            style={{
              width: size,
              height: size,
              borderRadius: borderRadius,
              boxShadow: `
                inset 1px 1px 2px rgba(255,255,255,0.1),
                inset -1px -1px 2px rgba(0,0,0,0.3),
                0 2px 4px rgba(0,0,0,0.3)
              `,
            }}
          >
            {/* 흰색 지우개 아이콘 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
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
          </div>
        </div>
      </button>
    );
  };

  return (
    <fieldset className="border-2 border-neutral-300 rounded-lg p-2 sm:p-4 bg-neutral-100/95 backdrop-blur-sm">
      <legend className="px-2 text-xs sm:text-sm font-medium text-neutral-600">
        주사위 선택
      </legend>
      {/* 모바일: 2줄 배치 (4+4) */}
      <div className="sm:hidden flex flex-col gap-1 items-center">
        <div className="flex gap-1.5 items-center justify-center">
          {topRowValues.map(renderDiceButton)}
        </div>
        <div className="flex gap-1.5 items-center justify-center">
          {bottomRowValues.map(renderDiceButton)}
          {renderEraserButton()}
        </div>
      </div>
      {/* 데스크탑: 1줄 배치 */}
      <div className="hidden sm:flex gap-3 items-center justify-center">
        {allValues.map(renderDiceButton)}
        {renderEraserButton()}
      </div>
      <p className="text-xs text-neutral-500 text-center mt-1.5 sm:mt-2 hidden sm:block">
        키보드 0-6, E(지우개)로 선택할 수 있습니다
      </p>
    </fieldset>
  );
}

export default DicePalette;
