'use client';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onPreview?: () => void;
  minScale?: number;
  maxScale?: number;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onPreview,
  minScale = 0.5,
  maxScale = 3,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);
  const canZoomIn = scale < maxScale;
  const canZoomOut = scale > minScale;

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-neutral-200 p-1">
      {/* 미리보기 버튼 */}
      {onPreview && (
        <button
          onClick={onPreview}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-neutral-100 text-neutral-700"
          title="진행 상황 미리보기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}

      {/* 구분선 */}
      {onPreview && (
        <div className="w-px h-5 bg-neutral-200" />
      )}
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
