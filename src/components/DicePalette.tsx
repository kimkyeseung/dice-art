'use client';

import { DiceValue } from '@/types';
import { Dice } from './Dice';

interface DicePaletteProps {
  selectedValue: DiceValue | null;
  onSelect: (value: DiceValue) => void;
  hidden?: boolean; // 팔레트 숨김 (이동 모드 등)
}

// 모바일용 2줄 배치: 윗줄 [0,1,2,3], 아랫줄 [4,5,6]
const topRowValues: DiceValue[] = [0, 1, 2, 3];
const bottomRowValues: DiceValue[] = [4, 5, 6];
const allValues: DiceValue[] = [0, 1, 2, 3, 4, 5, 6];

export function DicePalette({ selectedValue, onSelect, hidden = false }: DicePaletteProps) {
  if (hidden) {
    return null;
  }

  const renderButton = (value: DiceValue) => (
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

  return (
    <fieldset className="border-2 border-neutral-300 rounded-lg p-2 sm:p-4 bg-neutral-100/95 backdrop-blur-sm">
      <legend className="px-2 text-xs sm:text-sm font-medium text-neutral-600">
        주사위 선택
      </legend>
      {/* 모바일: 2줄 배치 (:::모양) */}
      <div className="sm:hidden flex flex-col gap-1 items-center">
        <div className="flex gap-1.5 items-center justify-center">
          {topRowValues.map(renderButton)}
        </div>
        <div className="flex gap-1.5 items-center justify-center">
          {bottomRowValues.map(renderButton)}
        </div>
      </div>
      {/* 데스크탑: 1줄 배치 */}
      <div className="hidden sm:flex gap-3 items-center justify-center">
        {allValues.map(renderButton)}
      </div>
      <p className="text-xs text-neutral-500 text-center mt-1.5 sm:mt-2 hidden sm:block">
        키보드 0-6으로도 선택할 수 있습니다
      </p>
    </fieldset>
  );
}

export default DicePalette;
