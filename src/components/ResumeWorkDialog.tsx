'use client';

interface ResumeWorkDialogProps {
  gridSize: string;
  progress: number;
  lastUpdated: string;
  onResume: () => void;
  onNewWork: () => void;
}

export function ResumeWorkDialog({
  gridSize,
  progress,
  lastUpdated,
  onResume,
  onNewWork,
}: ResumeWorkDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-neutral-800 mb-2">
          진행 중인 작업이 있습니다
        </h2>
        <p className="text-neutral-600 mb-4">
          이전에 작업하던 내용을 이어서 하시겠습니까?
        </p>

        {/* 저장된 작업 정보 */}
        <div className="bg-neutral-100 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-500">그리드 크기</span>
            <span className="font-medium text-neutral-700">{gridSize}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-500">진행률</span>
            <span className="font-medium text-neutral-700">{progress}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">마지막 저장</span>
            <span className="font-medium text-neutral-700">{lastUpdated}</span>
          </div>

          {/* 진행률 바 */}
          <div className="mt-3 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onNewWork}
            className="flex-1 px-4 py-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-medium"
          >
            새로 시작
          </button>
          <button
            onClick={onResume}
            className="flex-1 px-4 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium"
          >
            이어하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeWorkDialog;
