'use client';

import { memo, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { GridState, SectionLayout } from '@/types';
import {
  calculateAllSectionProgress,
  getSectionLabel,
  getAdjacentSection,
} from '@/utils/sectionUtils';

interface SectionNavigatorProps {
  gridState: GridState;
  layout: SectionLayout;
  currentRow: number;
  currentCol: number;
  onSectionChange: (row: number, col: number) => void;
}

const STORAGE_KEY = 'dice-art-section-nav-position';
const BUTTON_SIZE = 56; // w-14 = 56px
const MARGIN = 16; // 화면 가장자리 여백

function SectionNavigatorComponent({
  gridState,
  layout,
  currentRow,
  currentCol,
  onSectionChange,
}: SectionNavigatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 드래그 관련 상태
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 저장된 위치 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 화면 범위 내로 조정
        const maxX = window.innerWidth - BUTTON_SIZE - MARGIN;
        const maxY = window.innerHeight - BUTTON_SIZE - MARGIN;
        setPosition({
          x: Math.min(Math.max(MARGIN, parsed.x), maxX),
          y: Math.min(Math.max(MARGIN, parsed.y), maxY),
        });
      }
    } catch {
      // 저장된 위치가 없으면 기본 위치 사용
    }
  }, []);

  // 위치 저장
  const savePosition = useCallback((x: number, y: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    } catch {
      // localStorage 저장 실패 무시
    }
  }, []);

  // 드래그 시작
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isExpanded) return;

    const button = buttonRef.current;
    if (!button) return;

    // 현재 버튼 위치 계산
    const rect = button.getBoundingClientRect();
    const currentX = rect.left;
    const currentY = rect.top;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: currentX,
      posY: currentY,
    };
    hasDraggedRef.current = false;

    // 포인터 캡처
    button.setPointerCapture(e.pointerId);
  }, [isExpanded]);

  // 드래그 중
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // 5px 이상 움직여야 드래그로 인식
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true;
      setIsDragging(true);

      // 새 위치 계산 (화면 범위 내로 제한)
      const maxX = window.innerWidth - BUTTON_SIZE - MARGIN;
      const maxY = window.innerHeight - BUTTON_SIZE - MARGIN;
      const newX = Math.min(Math.max(MARGIN, dragStartRef.current.posX + deltaX), maxX);
      const newY = Math.min(Math.max(MARGIN, dragStartRef.current.posY + deltaY), maxY);

      setPosition({ x: newX, y: newY });
    }
  }, []);

  // 드래그 종료
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const button = buttonRef.current;
    if (button) {
      button.releasePointerCapture(e.pointerId);
    }

    if (hasDraggedRef.current && position) {
      // 드래그가 있었으면 위치 저장
      savePosition(position.x, position.y);
    }

    dragStartRef.current = null;
    setIsDragging(false);

    // 드래그 없이 클릭만 했으면 바텀 시트 열기
    if (!hasDraggedRef.current) {
      setIsExpanded(true);
    }
  }, [position, savePosition]);

  // 위치 초기화 (더블 클릭)
  const handleDoubleClick = useCallback(() => {
    setPosition(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  }, []);

  // 모든 섹션의 진행률 계산
  const progressGrid = useMemo(
    () => calculateAllSectionProgress(gridState, layout),
    [gridState, layout]
  );

  // 통계 계산
  const stats = useMemo(() => {
    const flat = progressGrid.flat();
    return {
      completed: flat.filter(p => p === 100).length,
      inProgress: flat.filter(p => p > 0 && p < 100).length,
      notStarted: flat.filter(p => p === 0).length,
      total: flat.length,
    };
  }, [progressGrid]);

  // 현재 섹션의 진행률
  const currentProgress = progressGrid[currentRow][currentCol];
  const currentLabel = getSectionLabel(currentRow, currentCol);

  // 섹션 이동 핸들러
  const handleSectionSelect = useCallback((row: number, col: number) => {
    if (isAnimating) return;

    setIsAnimating(true);

    // 햅틱 피드백
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    onSectionChange(row, col);
    setIsExpanded(false);

    // 토스트 표시
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);

    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, onSectionChange]);

  // 방향키 네비게이션
  const handleNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const adjacent = getAdjacentSection(currentRow, currentCol, layout, direction);
    if (adjacent && !isAnimating) {
      handleSectionSelect(adjacent[0], adjacent[1]);
    }
  }, [currentRow, currentCol, layout, isAnimating, handleSectionSelect]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Shift + 화살표로 섹션 이동
      if (e.shiftKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handleNavigation('up');
            break;
          case 'ArrowDown':
            e.preventDefault();
            handleNavigation('down');
            break;
          case 'ArrowLeft':
            e.preventDefault();
            handleNavigation('left');
            break;
          case 'ArrowRight':
            e.preventDefault();
            handleNavigation('right');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigation]);

  // 버튼 스타일 계산
  const buttonStyle = position
    ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`fixed w-14 h-14 bg-white shadow-xl rounded-full
                   flex flex-col items-center justify-center z-40
                   border-2 border-blue-500
                   transition-shadow duration-200
                   touch-none select-none
                   ${isDragging ? 'scale-110 shadow-2xl cursor-grabbing' : 'hover:shadow-2xl hover:scale-105 cursor-grab'}
                   ${!position ? 'bottom-[140px] right-4 sm:bottom-6 sm:right-6' : ''}`}
        style={buttonStyle}
        aria-label={`섹션 ${currentLabel}, 진행률 ${currentProgress}%, 클릭하여 섹션 선택, 드래그하여 이동`}
      >
        {/* 원형 프로그레스 배경 */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke={currentProgress === 100 ? '#22c55e' : '#3b82f6'}
            strokeWidth="3"
            strokeDasharray={`${currentProgress * 1.57} 157`}
            className="transition-all duration-500"
          />
        </svg>

        {/* 섹션 라벨 */}
        <span className="text-sm font-bold text-neutral-800 relative z-10">
          {currentLabel}
        </span>

        {/* 완료 섹션 뱃지 */}
        {stats.completed > 0 && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold
                          w-5 h-5 rounded-full flex items-center justify-center shadow-md">
            {stats.completed}
          </div>
        )}
      </button>

      {/* 섹션 전환 토스트 */}
      {showToast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50
                     animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm
                          flex items-center gap-2 shadow-lg">
            <span className="font-bold">{currentLabel}</span>
            <span className="opacity-50">|</span>
            <span className={currentProgress === 100 ? 'text-green-400' : 'text-blue-400'}>
              {currentProgress}%
            </span>
          </div>
        </div>
      )}

      {/* 바텀 시트 오버레이 */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end
                     animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto
                       animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div className="sticky top-0 bg-white pt-3 pb-2 px-6">
              <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto" />
            </div>

            {/* 헤더 */}
            <div className="px-6 pb-4">
              <h3 className="text-lg font-bold text-neutral-800">
                섹션 선택
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                탭하여 해당 섹션으로 이동
              </p>
            </div>

            {/* 현재 섹션 정보 */}
            <div className="px-6 pb-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    현재: 섹션 {currentLabel}
                  </span>
                  <span className={`text-sm font-bold ${
                    currentProgress === 100 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {currentProgress}%
                  </span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentProgress === 100
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 미니맵 그리드 */}
            <div className="px-6 pb-4">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }}
              >
                {layout.sections.map((rowSections, rowIdx) =>
                  rowSections.map((_, colIdx) => {
                    const progress = progressGrid[rowIdx][colIdx];
                    const isCurrent = rowIdx === currentRow && colIdx === currentCol;
                    const isComplete = progress === 100;
                    const hasProgress = progress > 0;

                    return (
                      <button
                        key={`${rowIdx}-${colIdx}`}
                        onClick={() => handleSectionSelect(rowIdx, colIdx)}
                        disabled={isAnimating}
                        className={`
                          aspect-square rounded-xl font-bold text-base
                          transition-all duration-200 active:scale-95
                          flex flex-col items-center justify-center gap-1
                          ${isCurrent
                            ? 'ring-4 ring-blue-500 ring-offset-2 scale-105'
                            : 'hover:scale-102'}
                          ${isComplete
                            ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-200'
                            : hasProgress
                              ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-200'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}
                        `}
                      >
                        <span>{getSectionLabel(rowIdx, colIdx)}</span>
                        <span className="text-xs opacity-80">{progress}%</span>
                        {isComplete && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 통계 */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </div>
                  <div className="text-xs text-green-700 mt-1">완료</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.inProgress}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">진행중</div>
                </div>
                <div className="bg-neutral-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-neutral-500">
                    {stats.notStarted}
                  </div>
                  <div className="text-xs text-neutral-600 mt-1">미시작</div>
                </div>
              </div>
            </div>

            {/* 힌트 */}
            <div className="px-6 pb-4 text-center">
              <p className="text-xs text-neutral-400">
                <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono">Shift</kbd>
                {' + '}
                <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono">방향키</kbd>
                {' 로 빠른 이동 (데스크탑)'}
              </p>
            </div>

            {/* 닫기 버튼 */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200
                           text-neutral-700 font-medium rounded-xl
                           transition-colors active:scale-98"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const SectionNavigator = memo(SectionNavigatorComponent);
