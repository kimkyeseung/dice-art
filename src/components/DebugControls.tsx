"use client";

import { useState } from "react";
import { GridState } from "@/types";
import {
  fillCorrect,
  fillRandom,
  fillPartial,
  clearAll,
  fillWithErrors,
} from "@/utils/debugUtils";

interface DebugControlsProps {
  gridState: GridState;
  onGridUpdate: (newGrid: GridState) => void;
}

/**
 * 개발 환경 전용 디버그 컨트롤
 * 그리드를 빠르게 채우거나 초기화하는 버튼 모음
 */
export function DebugControls({ gridState, onGridUpdate }: DebugControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 프로덕션에서는 렌더링하지 않음
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const buttons = [
    {
      label: "✓",
      title: "정답대로 채우기 (Ctrl+Shift+D)",
      onClick: () => onGridUpdate(fillCorrect(gridState)),
      className: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "🎲",
      title: "랜덤 채우기",
      onClick: () => onGridUpdate(fillRandom(gridState)),
      className: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "½",
      title: "50% 채우기",
      onClick: () => onGridUpdate(fillPartial(gridState, 50)),
      className: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      label: "⚠",
      title: "10% 틀린 값으로 채우기",
      onClick: () => onGridUpdate(fillWithErrors(gridState, 10)),
      className: "bg-orange-500 hover:bg-orange-600",
    },
    {
      label: "🗑",
      title: "모두 지우기",
      onClick: () => onGridUpdate(clearAll(gridState)),
      className: "bg-red-500 hover:bg-red-600",
    },
  ];

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-1">
      {/* 확장된 버튼들 */}
      {isExpanded && (
        <div className="flex flex-col gap-1 mb-1">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              className={`w-10 h-10 ${btn.className} text-white rounded-lg shadow-lg transition-all text-lg flex items-center justify-center`}
              title={btn.title}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* 토글 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-10 h-10 ${
          isExpanded ? "bg-neutral-700" : "bg-neutral-500"
        } hover:bg-neutral-600 text-white rounded-lg shadow-lg transition-all text-lg flex items-center justify-center`}
        title="디버그 메뉴"
      >
        🐛
      </button>
    </div>
  );
}
