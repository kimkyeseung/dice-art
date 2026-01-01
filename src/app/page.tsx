'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ImageUploader, Grid, DicePalette, ResumeWorkDialog, ZoomControls, Switch, ShareDialog, NicknameDialog } from '@/components';
import { useUser } from '@/contexts/UserContext';
import { GridState, DiceValue } from '@/types';
import { processImage, calculateProgress } from '@/utils/imageProcessor';
import { loadWork, clearWork, getSavedWorkSummary } from '@/utils/storage';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useZoomPan } from '@/hooks/useZoomPan';
import { exportGridAsImage, isGridComplete, renderGridToCanvas } from '@/utils/exportImage';

export default function Home() {
  const [gridState, setGridState] = useState<GridState | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedDice, setSelectedDice] = useState<DiceValue | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workId, setWorkId] = useState<string | undefined>(undefined);
  const [maxDimension, setMaxDimension] = useState(50); // 그리드 최대 크기

  // 복구 다이얼로그 상태
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedWorkSummary, setSavedWorkSummary] = useState<ReturnType<typeof getSavedWorkSummary> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 공유 다이얼로그 상태
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareImageData, setShareImageData] = useState<string | null>(null);

  // 틀린 값 표시 상태
  const [showMismatch, setShowMismatch] = useState(false);

  // 사용자 상태
  const { user, setNickname } = useUser();
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);

  // 자동 저장 훅
  const { save } = useAutoSave({
    gridState,
    originalImageData: originalImage,
    workId,
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

  // 초기 로드 시 저장된 작업 확인
  useEffect(() => {
    const summary = getSavedWorkSummary();
    if (summary.exists) {
      setSavedWorkSummary(summary);
      setShowResumeDialog(true);
    }
    setIsInitialized(true);
  }, []);

  // 저장된 작업 이어하기
  const handleResume = useCallback(() => {
    const savedWork = loadWork();
    if (savedWork) {
      setGridState(savedWork.gridState);
      setOriginalImage(savedWork.originalImageData);
      setWorkId(savedWork.id);
    }
    setShowResumeDialog(false);
  }, []);

  // 새 작업 시작 (저장된 작업 삭제)
  const handleNewWork = useCallback(() => {
    clearWork();
    setShowResumeDialog(false);
  }, []);

  const handleImageLoad = useCallback((imageData: string, image: HTMLImageElement, dimension: number = 50) => {
    setIsProcessing(true);
    setOriginalImage(imageData);
    setMaxDimension(dimension);

    setTimeout(() => {
      try {
        const grid = processImage(image, dimension);
        setGridState(grid);
        setWorkId(undefined); // 새 작업이므로 ID 초기화
      } catch (error) {
        console.error('이미지 처리 실패:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, []);

  // 더 높은 해상도로 도전
  const handleHigherResolution = useCallback(() => {
    if (!originalImage) return;

    const newDimension = maxDimension * 2;
    setIsProcessing(true);
    setMaxDimension(newDimension);

    // 이미지 다시 로드하여 처리
    const img = new Image();
    img.onload = () => {
      setTimeout(() => {
        try {
          const grid = processImage(img, newDimension);
          setGridState(grid);
          setWorkId(undefined);
          setSelectedDice(null);
        } catch (error) {
          console.error('이미지 처리 실패:', error);
        } finally {
          setIsProcessing(false);
        }
      }, 100);
    };
    img.src = originalImage;
  }, [originalImage, maxDimension]);

  const handleReset = () => {
    clearWork();
    setGridState(null);
    setOriginalImage(null);
    setSelectedDice(null);
    setWorkId(undefined);
    setMaxDimension(50);
  };

  // 수동 저장
  const handleManualSave = () => {
    const savedWork = save();
    if (savedWork) {
      setWorkId(savedWork.id);
      alert('저장되었습니다!');
    }
  };

  // 이미지 다운로드
  const handleDownload = () => {
    if (!gridState) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `dice-art-${timestamp}.png`;

    // 고해상도로 내보내기 (셀 크기 60px)
    exportGridAsImage(gridState, 60, filename);
  };

  // 갤러리에 공유
  const handleShare = () => {
    if (!gridState) return;

    // 이미지 데이터 생성
    const canvas = renderGridToCanvas(gridState, 60);
    const imageData = canvas.toDataURL('image/png');
    setShareImageData(imageData);
    setShowShareDialog(true);
  };

  // 공유 성공
  const handleShareSuccess = () => {
    setShowShareDialog(false);
    setShareImageData(null);
    alert('갤러리에 공유되었습니다!');
  };

  // 셀 업데이트 핸들러
  const handleCellUpdate = useCallback((row: number, col: number, value: DiceValue | null) => {
    setGridState(prevState => {
      if (!prevState) return null;

      const newCells = prevState.cells.map((r, rIdx) =>
        rIdx === row
          ? r.map((c, cIdx) =>
              cIdx === col
                ? { ...c, filledValue: value }
                : c
            )
          : r
      );

      return {
        ...prevState,
        cells: newCells,
      };
    });
  }, []);

  // 키보드 단축키 (0-6으로 주사위 선택)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;
      if (key >= '0' && key <= '6') {
        setSelectedDice(parseInt(key) as DiceValue);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const progress = gridState ? calculateProgress(gridState) : 0;
  const isComplete = gridState ? isGridComplete(gridState) : false;

  // 초기화 전에는 아무것도 렌더링하지 않음 (hydration 문제 방지)
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* 복구 다이얼로그 */}
      {showResumeDialog && savedWorkSummary?.exists && (
        <ResumeWorkDialog
          gridSize={savedWorkSummary.gridSize!}
          progress={savedWorkSummary.progress!}
          lastUpdated={savedWorkSummary.lastUpdated!}
          onResume={handleResume}
          onNewWork={handleNewWork}
        />
      )}

      {/* 헤더 */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Dice Art</h1>
                <p className="text-xs sm:text-sm text-neutral-500 hidden sm:block">
                  이미지를 주사위 아트로 변환하세요
                </p>
              </div>
              <Link
                href="/gallery"
                className="px-3 py-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                갤러리
              </Link>
              {user && (
                <Link
                  href="/my-artworks"
                  className="px-3 py-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  내 작품
                </Link>
              )}
              {/* 사용자 정보 */}
              {user ? (
                <button
                  onClick={() => setShowNicknameDialog(true)}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  {user.nickname}
                </button>
              ) : (
                <button
                  onClick={() => setShowNicknameDialog(true)}
                  className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  닉네임 설정
                </button>
              )}
            </div>
            {gridState && (
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* 진행률 - 모바일에서는 숫자만 */}
                <div className="text-xs sm:text-sm text-neutral-600">
                  <span className="hidden sm:inline">진행률: </span>
                  <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>{progress}%</span>
                </div>
                {/* 그리드 크기 - 모바일에서 숨김 */}
                <div className="text-sm text-neutral-500 hidden md:block">
                  {gridState.width} × {gridState.height} = {gridState.width * gridState.height}칸
                </div>
                {/* 버튼들 */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={handleDownload}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                      isComplete
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }`}
                    disabled={!isComplete}
                    title={isComplete ? '이미지 다운로드' : '모든 칸을 채워야 다운로드할 수 있습니다'}
                  >
                    <span className="hidden sm:inline">다운로드</span>
                    <span className="sm:hidden">↓</span>
                  </button>
                  <button
                    onClick={handleManualSave}
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <span className="hidden sm:inline">저장</span>
                    <span className="sm:hidden">💾</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-neutral-200 hover:bg-neutral-300 rounded-lg transition-colors"
                  >
                    <span className="hidden sm:inline">새 이미지</span>
                    <span className="sm:hidden">✕</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 이미지 업로드 화면 */}
        {!gridState && !isProcessing && (
          <div className="max-w-xl mx-auto">
            <ImageUploader onImageLoad={handleImageLoad} />
            <p className="text-center text-xs sm:text-sm text-neutral-500 mt-4 sm:mt-6 px-2">
              업로드한 이미지는 주사위 눈의 밝기로 변환됩니다.<br />
              모든 칸을 주사위로 채우면 완성된 작품을 다운로드할 수 있습니다.
            </p>
            <p className="text-center text-xs text-neutral-400 mt-2">
              진행 상황은 1분마다 자동으로 저장됩니다.
            </p>
          </div>
        )}

        {/* 로딩 */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            <p className="mt-4 text-neutral-600">이미지 분석 중...</p>
          </div>
        )}

        {/* 그리드 작업 화면 */}
        {gridState && !isProcessing && (
          <div className="space-y-4 sm:space-y-6">
            {/* 완성 축하 메시지 */}
            {isComplete && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-2">🎉</div>
                <h2 className="text-lg sm:text-xl font-bold text-green-800 mb-2">완성!</h2>
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
                    2배 해상도로 도전 ({gridState.width * 2}×{gridState.height * 2})
                  </button>
                </div>
              </div>
            )}

            {/* 사용 안내 */}
            {!isComplete && selectedDice === null && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <span className="hidden sm:inline">아래 팔레트에서 주사위를 선택하거나 키보드 </span>
                  <span className="sm:hidden">팔레트에서 주사위 선택 또는 </span>
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 rounded text-xs sm:text-sm font-mono">0</kbd>-<kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 rounded text-xs sm:text-sm font-mono">6</kbd>
                  <span className="hidden sm:inline"> 키를 눌러 시작하세요</span>
                </p>
              </div>
            )}

            {/* 선택된 주사위 표시 */}
            {!isComplete && selectedDice !== null && (
              <div className="text-center text-xs sm:text-sm text-neutral-600">
                <span className="hidden sm:inline">선택된 주사위: <span className="font-bold">{selectedDice}</span> | 좌클릭/드래그로 채우기 | 우클릭으로 지우기</span>
                <span className="sm:hidden">주사위 <span className="font-bold">{selectedDice}</span> 선택됨 · 탭/드래그: 채우기 · 길게 누름: 지우기</span>
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
                minScale={0.5}
                maxScale={3}
              />
            </div>

            {/* 그리드 영역 */}
            <div className="relative">
              <div
                ref={containerRef}
                className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-6 shadow-sm overflow-auto"
                style={{ maxHeight: 'calc(100vh - 340px)', minHeight: '300px' }}
              >
                <div
                  className="inline-block origin-top-left transition-transform duration-100"
                  style={{
                    transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
                  }}
                >
                  <Grid
                    gridState={gridState}
                    cellSize={24}
                    selectedDice={selectedDice}
                    onCellUpdate={handleCellUpdate}
                    scale={scale}
                    showMismatch={showMismatch}
                  />
                </div>
              </div>

              {/* 줌 안내 */}
              <p className="text-xs text-neutral-400 text-center mt-2 hidden sm:block">
                Ctrl + 휠로 줌 조절
              </p>
            </div>

            {/* 팔레트 (하단 고정) */}
            <div className="sticky bottom-2 sm:bottom-4">
              <DicePalette
                selectedValue={selectedDice}
                onSelect={setSelectedDice}
              />
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-neutral-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm text-neutral-500">
          <Link href="/gallery" className="hover:text-neutral-700 transition-colors">
            Dice Art Gallery
          </Link>
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
          initialValue={user?.nickname || ''}
          title={user ? '닉네임 변경' : '닉네임 설정'}
          description={user ? '새 닉네임을 입력해 주세요.' : '갤러리에서 사용할 닉네임을 입력해 주세요.'}
          submitLabel={user ? '변경' : '확인'}
        />
      )}
    </div>
  );
}
