'use client';

import { memo } from 'react';
import { DiceValue } from '@/types';

interface NumberCellProps {
  value: DiceValue;
  size?: number;
  className?: string;
}

export const NumberCell = memo(function NumberCell({ value, size = 40, className = '' }: NumberCellProps) {
  const fontSize = Math.max(Math.round(size * 0.4), 12);

  return (
    <div
      className={`flex items-center justify-center font-mono font-bold select-none bg-white text-neutral-800 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: fontSize,
      }}
    >
      {value}
    </div>
  );
});

export default NumberCell;
