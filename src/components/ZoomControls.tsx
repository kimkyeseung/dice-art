'use client';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  minScale?: number;
  maxScale?: number;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  minScale = 0.5,
  maxScale = 3,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);
  const canZoomIn = scale < maxScale;
  const canZoomOut = scale > minScale;

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-neutral-200 p-1">
      {/* 줌 아웃 */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors text-lg font-medium
          ${canZoomOut
            ? 'hover:bg-neutral-100 text-neutral-700'
            : 'text-neutral-300 cursor-not-allowed'
          }`}
        title="축소 (Ctrl+휠)"
      >
        −
      </button>

      {/* 현재 줌 레벨 / 리셋 버튼 */}
      <button
        onClick={onReset}
        className="min-w-[3.5rem] h-8 px-2 flex items-center justify-center text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
        title="줌 리셋"
      >
        {percentage}%
      </button>

      {/* 줌 인 */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors text-lg font-medium
          ${canZoomIn
            ? 'hover:bg-neutral-100 text-neutral-700'
            : 'text-neutral-300 cursor-not-allowed'
          }`}
        title="확대 (Ctrl+휠)"
      >
        +
      </button>
    </div>
  );
}

export default ZoomControls;
