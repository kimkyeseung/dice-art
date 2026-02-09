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
  };
}

export default useZoomPan;
