'use client';

import { GridMode } from './Grid';

interface ModeToggleProps {
  mode: GridMode;
  onModeChange: (mode: GridMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-300 bg-white p-0.5 sm:hidden">
      <button
        onClick={() => onModeChange('fill')}
        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
          mode === 'fill'
            ? 'bg-blue-500 text-white'
            : 'text-neutral-600 hover:bg-neutral-100'
        }`}
        title="주사위 채우기 모드"
      >
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
          채우기
        </span>
      </button>
      <button
        onClick={() => onModeChange('pan')}
        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
          mode === 'pan'
            ? 'bg-blue-500 text-white'
            : 'text-neutral-600 hover:bg-neutral-100'
        }`}
        title="영역 이동 모드"
      >
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
          이동
        </span>
      </button>
    </div>
  );
}

export default ModeToggle;
