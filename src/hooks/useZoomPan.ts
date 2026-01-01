'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UseZoomPanOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

export function useZoomPan(options: UseZoomPanOptions = {}) {
  const { minScale = 0.5, maxScale = 3, initialScale = 1 } = options;

  const [state, setState] = useState<ZoomPanState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });

  // 줌 인/아웃
  const zoomIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, maxScale),
    }));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.25, minScale),
    }));
  }, [minScale]);

  // 줌 리셋
  const resetZoom = useCallback(() => {
    setState({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
    });
  }, [initialScale]);

  // 줌 설정
  const setScale = useCallback(
    (scale: number) => {
      setState((prev) => ({
        ...prev,
        scale: Math.max(minScale, Math.min(maxScale, scale)),
      }));
    },
    [minScale, maxScale]
  );

  // 휠 줌 핸들러
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Ctrl 또는 Meta(Cmd) 키가 눌렸을 때만 줌
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setState((prev) => ({
        ...prev,
        scale: Math.max(minScale, Math.min(maxScale, prev.scale + delta)),
      }));
    },
    [minScale, maxScale]
  );

  // 패닝 시작 (가운데 마우스 버튼 또는 스페이스바+드래그)
  const startPanning = useCallback((x: number, y: number) => {
    isPanning.current = true;
    lastPanPosition.current = { x, y };
  }, []);

  // 패닝 이동
  const updatePanning = useCallback((x: number, y: number) => {
    if (!isPanning.current) return;

    const dx = x - lastPanPosition.current.x;
    const dy = y - lastPanPosition.current.y;
    lastPanPosition.current = { x, y };

    setState((prev) => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));
  }, []);

  // 패닝 종료
  const stopPanning = useCallback(() => {
    isPanning.current = false;
  }, []);

  // 휠 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return {
    containerRef,
    scale: state.scale,
    translateX: state.translateX,
    translateY: state.translateY,
    zoomIn,
    zoomOut,
    resetZoom,
    setScale,
    startPanning,
    updatePanning,
    stopPanning,
    isPanning: isPanning.current,
  };
}

export default useZoomPan;
