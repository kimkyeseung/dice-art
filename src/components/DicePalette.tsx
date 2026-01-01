'use client';

import { DiceValue } from '@/types';
import { Dice } from './Dice';

interface DicePaletteProps {
  selectedValue: DiceValue | null;
  onSelect: (value: DiceValue) => void;
}

const diceValues: DiceValue[] = [1, 2, 3, 4, 5, 6];

export function DicePalette({ selectedValue, onSelect }: DicePaletteProps) {
  return (
    <fieldset className="border-2 border-neutral-300 rounded-lg p-2 sm:p-4 bg-neutral-100/95 backdrop-blur-sm">
      <legend className="px-2 text-xs sm:text-sm font-medium text-neutral-600">
        주사위 선택
      </legend>
      <div className="flex gap-1.5 sm:gap-3 items-center justify-center">
        {diceValues.map((value) => (
          <button
            key={value}
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
        ))}
      </div>
      <p className="text-xs text-neutral-500 text-center mt-1.5 sm:mt-2 hidden sm:block">
        키보드 1-6으로도 선택할 수 있습니다
      </p>
    </fieldset>
  );
}

export default DicePalette;
