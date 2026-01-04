"use client";

import { useState, useCallback, useEffect, use, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Grid,
  DicePalette,
  ZoomControls,
  Switch,
  ShareDialog,
  NicknameDialog,
  ProgressPreviewDialog,
  SectionNavigator,
  DebugControls,
} from "@/components";
import type { PaletteValue } from "@/components";
import { useUser } from "@/contexts/UserContext";
import { GridState, DiceValue, SectionLayout } from "@/types";
import { processImage, calculateProgress } from "@/utils/imageProcessor";
import { loadWork, saveWork, deleteWork } from "@/utils/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useZoomPan } from "@/hooks/useZoomPan";
import { useImageProcessorWorker } from "@/hooks/useImageProcessorWorker";
import {
  exportGridAsImage,
  isGridComplete,
  renderGridToCanvas,
} from "@/utils/exportImage";
import {
  calculateSectionLayout,
  extractSectionGrid,
} from "@/utils/sectionUtils";
import { fillCorrect } from "@/utils/debugUtils";

interface WorkPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkPage({ params }: WorkPageProps) {
  const { id: workId } = use(params);
  const router = useRouter();

  const [gridState, setGridState] = useState<GridState | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedDice, setSelectedDice] = useState<PaletteValue | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maxDimension, setMaxDimension] = useState(50);

  // 공유 다이얼로그 상태
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareImageData, setShareImageData] = useState<string | null>(null);

  // 틀린 값 표시 상태
  const [showMismatch, setShowMismatch] = useState(false);

  // 진행상황 미리보기 다이얼로그 상태
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // 섹션 관련 상태
  const [currentSectionRow, setCurrentSectionRow] = useState(0);
  const [currentSectionCol, setCurrentSectionCol] = useState(0);

  // 사용자 상태
  const { user, setNickname } = useUser();
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);

  // 자동 저장 훅
  const { save, saveStatus } = useAutoSave({
    workId,
    gridState,
    originalImageData: originalImage,
    enabled: gridState !== null,
  });

  // 줌/패닝 훅
  const {
    containerRef,
    scale,
    translateX,
    translateY,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useZoomPan({ minScale: 0.5, maxScale: 3, initialScale: 1 });

  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Web Worker 훅
  const { processImage: processImageWorker, isSupported: isWorkerSupported } =
    useImageProcessorWorker();

  // 모바일 여부 확인
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 섹션 레이아웃 계산 (모바일에서 그리드가 큰 경우에만)
  const sectionLayout = useMemo<SectionLayout | null>(() => {
    if (!gridState) return null;
    // PC에서는 섹션 분할하지 않음
    if (!isMobile) return null;
    return calculateSectionLayout(gridState.width, gridState.height);
  }, [gridState, isMobile]);

  // 현재 섹션 정보
  const currentSection = useMemo(() => {
    if (!sectionLayout) return null;
    return sectionLayout.sections[currentSectionRow][currentSectionCol];
  }, [sectionLayout, currentSectionRow, currentSectionCol]);

  // 현재 섹션의 그리드 (섹션 모드일 때만)
  const currentSectionGrid = useMemo(() => {
    if (!gridState || !currentSection) return null;
    return extractSectionGrid(gridState, currentSection);
  }, [gridState, currentSection]);

  // 섹션 변경 핸들러
  const handleSectionChange = useCallback((row: number, col: number) => {
    setCurrentSectionRow(row);
    setCurrentSectionCol(col);
    // 섹션 변경 시 스크롤 위치 초기화
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, []);

  // 저장된 작업 불러오기
  useEffect(() => {
    const savedWork = loadWork(workId);

    if (savedWork) {
      setGridState(savedWork.gridState);
      setOriginalImage(savedWork.originalImageData);
      setMaxDimension(
        Math.max(savedWork.gridState.width, savedWork.gridState.height)
      );
    }

    setIsLoading(false);
  }, [workId]);

  // 더 높은 해상도로 도전
  const handleHigherResolution = useCallback(async () => {
    if (!originalImage) return;

    const newDimension = maxDimension * 2;
    setIsProcessing(true);
    setMaxDimension(newDimension);

    const img = new window.Image();
    img.onload = async () => {
      try {
        let grid;

        if (isWorkerSupported) {
          // Web Worker로 처리 (UI 블로킹 없음)
          grid = await processImageWorker(img, newDimension);
        } else {
          // Fallback: 메인 스레드에서 처리
          await new Promise((resolve) => setTimeout(resolve, 100));
          grid = processImage(img, newDimension);
        }

        setGridState(grid);
        setSelectedDice(null);
        // 새 그리드로 저장
        saveWork(workId, grid, originalImage);
      } catch (error) {
        console.error("이미지 처리 실패:", error);
      } finally {
        setIsProcessing(false);
      }
    };
    img.src = originalImage;
  }, [
    originalImage,
    maxDimension,
    workId,
    isWorkerSupported,
    processImageWorker,
  ]);

  // 작업 삭제 및 홈으로 이동
  const handleDelete = () => {
    if (confirm("이 작업을 삭제하시겠습니까?")) {
      deleteWork(workId);
      router.push("/");
    }
  };

  // 수동 저장
  const handleManualSave = () => {
    const savedWork = save();
    if (savedWork) {
      alert("저장되었습니다!");
    }
  };

  // 이미지 다운로드
  const handleDownload = () => {
    if (!gridState) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `dice-art-${timestamp}.png`;

    exportGridAsImage(gridState, 60, filename);
  };

  // 갤러리에 공유
  const handleShare = () => {
    if (!gridState) return;

    const canvas = renderGridToCanvas(gridState, 60);
    const imageData = canvas.toDataURL("image/png");
    setShareImageData(imageData);
    setShowShareDialog(true);
  };

  // 공유 성공
  const handleShareSuccess = () => {
    setShowShareDialog(false);
    setShareImageData(null);
    alert("갤러리에 공유되었습니다!");
  };

  // 셀 업데이트 핸들러 - 성능 최적화: 변경된 행만 새로 생성
  const handleCellUpdate = useCallback(
    (row: number, col: number, value: DiceValue | null) => {
      setGridState((prevState) => {
        if (!prevState) return null;

        const currentCell = prevState.cells[row]?.[col];
        // 값이 같으면 업데이트하지 않음
        if (currentCell && currentCell.filledValue === value) {
          return prevState;
        }

        // 변경된 행만 새로 생성 (shallow copy)
        const newRow = [...prevState.cells[row]];
        newRow[col] = { ...newRow[col], filledValue: value };

        const newCells = [...prevState.cells];
        newCells[row] = newRow;

        return {
          ...prevState,
          cells: newCells,
        };
      });
    },
    []
  );

  // 키보드 단축키 (0-6으로 주사위 선택, E로 지우개, Ctrl+Shift+D로 정답 채우기)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl+Shift+D: 정답대로 채우기 (디버그)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (gridState) {
          setGridState(fillCorrect(gridState));
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key >= "0" && key <= "6") {
        setSelectedDice(parseInt(key) as DiceValue);
      } else if (key === "e") {
        setSelectedDice("eraser");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gridState]);

  const progress = gridState ? calculateProgress(gridState) : 0;
  const isComplete = gridState ? isGridComplete(gridState) : false;

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  // 작업을 찾을 수 없음
  if (!gridState) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-600">작업을 찾을 수 없습니다.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          새 작업 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-neutral-100">
      {/* 헤더 */}
      <header className="bg-white border-b border-neutral-200 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 로고 + 네비게이션 (데스크탑) */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-lg sm:text-2xl font-bold text-neutral-800 whitespace-nowrap">
                  Dice Art
                </h1>
              </Link>
              {/* 자동 저장 상태 메시지 */}
              {saveStatus && (
                <span
                  className={`text-xs transition-opacity ${
                    saveStatus === "success" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {saveStatus === "success" ? "저장되었어요" : "저장 실패"}
                </span>
              )}
              {/* 데스크탑 네비게이션 */}
              <nav className="hidden sm:flex items-center gap-2">
                <Link
                  href="/gallery"
                  className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  갤러리
                </Link>
                <Link
                  href="/my-works"
                  className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  내 작업
                </Link>
                {user ? (
                  <button
                    onClick={() => setShowNicknameDialog(true)}
                    className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    {user.nickname}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowNicknameDialog(true)}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    닉네임 설정
                  </button>
                )}
              </nav>
            </div>

            {/* 오른쪽: 진행률 + 액션 버튼들 */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* 진행률 */}
              <span
                className={`text-sm sm:text-base font-bold ${
                  isComplete ? "text-green-600" : "text-blue-600"
                }`}
              >
                {progress}%
              </span>
              {/* 그리드 크기 - 데스크탑만 */}
              <div className="text-sm text-neutral-500 hidden md:block">
                {gridState.width} × {gridState.height} ={" "}
                {gridState.width * gridState.height}칸
              </div>
              {/* 버튼들 */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* 다운로드 - 완료 시에만 활성화 */}
                <button
                  onClick={handleDownload}
                  className={`p-2 sm:px-4 sm:py-2 text-sm rounded-lg transition-colors ${
                    isComplete
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  }`}
                  disabled={!isComplete}
                  title={
                    isComplete
                      ? "이미지 다운로드"
                      : "모든 칸을 채워야 다운로드할 수 있습니다"
                  }
                >
                  <span className="hidden sm:inline">다운로드</span>
                  <svg
                    className="w-5 h-5 sm:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
                {/* 저장 */}
                <button
                  onClick={handleManualSave}
                  className="p-2 sm:px-4 sm:py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="저장"
                >
                  <span className="hidden sm:inline">저장</span>
                  <svg
                    className="w-5 h-5 sm:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-4-4H8zM16 20v-6H8v6M8 4v4h6"
                    />
                  </svg>
                </button>
                {/* 삭제 */}
                <button
                  onClick={handleDelete}
                  className="p-2 sm:px-4 sm:py-2 text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-600 rounded-lg transition-colors"
                  title="삭제"
                >
                  <span className="hidden sm:inline">삭제</span>
                  <svg
                    className="w-5 h-5 sm:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-8 flex-1 min-h-0 overflow-hidden flex flex-col w-full">
          {/* 로딩 */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              <p className="mt-4 text-neutral-600">이미지 분석 중...</p>
            </div>
          )}

          {/* 그리드 작업 화면 */}
          {!isProcessing && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-4">
              {/* 완성 축하 메시지 */}
              {isComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 text-center">
                  <div className="text-3xl sm:text-4xl mb-2">🎉</div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800 mb-2">
                    완성!
                  </h2>
                  <p className="text-sm sm:text-base text-green-700 mb-4">
                    모든 칸을 채웠습니다. 다운로드하거나 갤러리에 공유해 보세요!
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleDownload}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
                    >
                      다운로드
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
                    >
                      갤러리에 공유
                    </button>
                    <button
                      onClick={handleHigherResolution}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
                    >
                      2배 해상도로 도전 ({gridState.width * 2}×
                      {gridState.height * 2})
                    </button>
                  </div>
                </div>
              )}

              {/* 사용 안내 */}
              {!isComplete && selectedDice === null && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    <span className="hidden sm:inline">
                      아래 팔레트에서 주사위를 선택하거나 키보드{" "}
                    </span>
                    <span className="sm:hidden">
                      팔레트에서 주사위 선택 또는{" "}
                    </span>
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 rounded text-xs sm:text-sm font-mono">
                      0
                    </kbd>
                    -
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 rounded text-xs sm:text-sm font-mono">
                      6
                    </kbd>
                    <span className="hidden sm:inline">
                      {" "}
                      키를 눌러 시작하세요
                    </span>
                  </p>
                </div>
              )}

              {/* 선택된 주사위/지우개 표시 */}
              {!isComplete && selectedDice !== null && (
                <div className="text-center text-xs sm:text-sm text-neutral-600">
                  {selectedDice === "eraser" ? (
                    <>
                      <span className="hidden sm:inline text-red-600">
                        지우개 선택됨 | 좌클릭/드래그로 지우기
                      </span>
                      <span className="sm:hidden text-red-600">
                        지우개 선택됨 · 탭/드래그로 지우기
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">
                        선택된 주사위:{" "}
                        <span className="font-bold">{selectedDice}</span> |
                        좌클릭/드래그로 채우기 | 우클릭으로 지우기
                      </span>
                      <span className="sm:hidden">
                        주사위 <span className="font-bold">{selectedDice}</span>{" "}
                        선택됨 · 탭/드래그: 채우기 · 길게 누름: 지우기
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 컨트롤 바 (줌, 틀린값 표시) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <Switch
                  checked={showMismatch}
                  onChange={setShowMismatch}
                  label="틀린 값 표시"
                  size="sm"
                />
                <ZoomControls
                  scale={scale}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onReset={resetZoom}
                  onPreview={() => setShowPreviewDialog(true)}
                  minScale={0.5}
                  maxScale={3}
                />
              </div>

              {/* 섹션 네비게이터 (섹션 모드일 때만 표시) - 플로팅 UI */}
              {sectionLayout && (
                <SectionNavigator
                  gridState={gridState}
                  layout={sectionLayout}
                  currentRow={currentSectionRow}
                  currentCol={currentSectionCol}
                  onSectionChange={handleSectionChange}
                />
              )}

              {/* 그리드 영역 */}
              <div className="relative flex-1 min-h-0 flex flex-col">
                <div
                  ref={(el) => {
                    // 두 ref를 모두 연결
                    if (containerRef)
                      (
                        containerRef as React.MutableRefObject<HTMLDivElement | null>
                      ).current = el;
                    (
                      scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
                    ).current = el;
                  }}
                  className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-6 shadow-sm overflow-auto flex-1 min-h-0"
                >
                  <div
                    className="inline-block origin-top-left transition-transform duration-100"
                    style={{
                      transform: `scale(${scale}) translate(${
                        translateX / scale
                      }px, ${translateY / scale}px)`,
                    }}
                  >
                    {/* 섹션 모드: 현재 섹션만 렌더링 */}
                    {sectionLayout && currentSectionGrid && currentSection ? (
                      <Grid
                        gridState={currentSectionGrid}
                        cellSize={24}
                        selectedDice={selectedDice}
                        onCellUpdate={handleCellUpdate}
                        scale={scale}
                        showMismatch={showMismatch}
                        scrollContainerRef={scrollContainerRef}
                        rowOffset={currentSection.startRow}
                        colOffset={currentSection.startCol}
                      />
                    ) : (
                      /* 일반 모드: 전체 그리드 렌더링 */
                      <Grid
                        gridState={gridState}
                        cellSize={24}
                        selectedDice={selectedDice}
                        onCellUpdate={handleCellUpdate}
                        scale={scale}
                        showMismatch={showMismatch}
                        scrollContainerRef={scrollContainerRef}
                      />
                    )}
                  </div>
                </div>

                {/* 줌 안내 */}
                <p className="text-xs text-neutral-400 text-center mt-2 hidden sm:block">
                  {sectionLayout ? "섹션을 클릭하여 이동 · " : ""}Ctrl + 휠로 줌
                  조절
                </p>
              </div>

              {/* 하단 컨트롤: 조이스틱(모바일) + 팔레트 */}
              <div className="flex-shrink-0 flex items-end gap-2 pb-2 sm:pb-0">
                {/* 팔레트 */}
                <div className="flex-1">
                  <DicePalette
                    selectedValue={selectedDice}
                    onSelect={setSelectedDice}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 푸터 - 모바일에서 숨김 */}
      <footer className="hidden sm:block border-t border-neutral-200 bg-white flex-shrink-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/gallery"
                className="hover:text-neutral-700 transition-colors"
              >
                Gallery
              </Link>
              <span className="text-neutral-300">|</span>
              <span>&copy; {new Date().getFullYear()} kimkyeseung</span>
            </div>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <span className="text-neutral-400">
              Inspired by{" "}
              <a
                href="https://www.instagram.com/anna.dice.artworks/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:text-pink-600 hover:underline"
              >
                @anna.dice.artworks
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* 공유 다이얼로그 */}
      {showShareDialog && gridState && shareImageData && (
        <ShareDialog
          gridState={gridState}
          imageData={shareImageData}
          onClose={() => {
            setShowShareDialog(false);
            setShareImageData(null);
          }}
          onSuccess={handleShareSuccess}
        />
      )}

      {/* 닉네임 설정 다이얼로그 */}
      {showNicknameDialog && (
        <NicknameDialog
          onSubmit={(nickname) => {
            setNickname(nickname);
            setShowNicknameDialog(false);
          }}
          onClose={() => setShowNicknameDialog(false)}
          initialValue={user?.nickname || ""}
          title={user ? "닉네임 변경" : "닉네임 설정"}
          description={
            user
              ? "새 닉네임을 입력해 주세요."
              : "갤러리에서 사용할 닉네임을 입력해 주세요."
          }
          submitLabel={user ? "변경" : "확인"}
        />
      )}

      {/* 진행상황 미리보기 다이얼로그 */}
      {showPreviewDialog && gridState && (
        <ProgressPreviewDialog
          gridState={gridState}
          onClose={() => setShowPreviewDialog(false)}
        />
      )}

      {/* 디버그 컨트롤 (개발 환경 전용) */}
      {gridState && (
        <DebugControls gridState={gridState} onGridUpdate={setGridState} />
      )}
    </div>
  );
}
