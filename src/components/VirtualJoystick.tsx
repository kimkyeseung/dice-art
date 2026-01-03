'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (deltaX: number, deltaY: number) => void;
  size?: number;
}

export function VirtualJoystick({ onMove, size = 100 }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const lastMoveRef = useRef({ x: 0, y: 0 });
  const isActiveRef = useRef(false); // 즉시 체크용 ref
  const centerRef = useRef({ x: 0, y: 0 }); // getBoundingClientRect 캐싱용

  const knobSize = size * 0.4;
  const maxDistance = (size - knobSize) / 2;

  // onMove를 ref로 저장하여 의존성 문제 해결
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  // 연속 이동을 위한 애니메이션 루프 - isActive일 때만 실행
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      // ref로 즉시 체크하여 비활성화 시 즉시 중단
      if (!isActiveRef.current) return;

      if (lastMoveRef.current.x !== 0 || lastMoveRef.current.y !== 0) {
        // 속도 조절 (거리에 비례), 방향 반전 (조이스틱 방향 = 스크롤 방향)
        const speed = 8;
        onMoveRef.current(
          -lastMoveRef.current.x * speed,
          -lastMoveRef.current.y * speed
        );
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null; // 메모리 누수 방지
      }
    };
  }, [isActive]);

  // updateKnobPosition을 먼저 선언 (handlePointerDown, handlePointerMove에서 사용)
  const updateKnobPosition = useCallback((rawX: number, rawY: number) => {
    // 최대 거리 제한
    const distance = Math.sqrt(rawX * rawX + rawY * rawY);
    let x = rawX;
    let y = rawY;

    if (distance > maxDistance) {
      const scale = maxDistance / distance;
      x = rawX * scale;
      y = rawY * scale;
    }

    setKnobPosition({ x, y });

    // 정규화된 이동값 (-1 ~ 1)
    lastMoveRef.current = {
      x: x / maxDistance,
      y: y / maxDistance,
    };
  }, [maxDistance]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Pointer capture with error handling
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture may fail in some edge cases
    }

    setIsActive(true);
    isActiveRef.current = true;

    // getBoundingClientRect 결과 캐싱
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updateKnobPosition(e.clientX - centerRef.current.x, e.clientY - centerRef.current.y);
    }
  }, [updateKnobPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // isActiveRef 사용으로 불필요한 리렌더링 방지
    if (!isActiveRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    // 캐시된 center 좌표 사용 (getBoundingClientRect 반복 호출 방지)
    updateKnobPosition(e.clientX - centerRef.current.x, e.clientY - centerRef.current.y);
  }, [updateKnobPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // 1. Ref 먼저 초기화 (애니메이션 즉시 중단)
    isActiveRef.current = false;
    lastMoveRef.current = { x: 0, y: 0 };

    // 2. 상태 업데이트
    setIsActive(false);
    setKnobPosition({ x: 0, y: 0 });

    // 3. Pointer capture 해제 (에러 핸들링 포함)
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // 이미 해제되었거나 유효하지 않은 경우
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none"
      style={{
        width: size,
        height: size,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 외부 원 (베이스) */}
      <div
        className="absolute rounded-full bg-neutral-200/80 border-2 border-neutral-300"
        style={{
          width: size,
          height: size,
          top: 0,
          left: 0,
        }}
      />

      {/* 내부 원 (노브) */}
      <div
        className={`absolute rounded-full transition-colors ${
          isActive ? 'bg-blue-500' : 'bg-neutral-400'
        }`}
        style={{
          width: knobSize,
          height: knobSize,
          top: size / 2 - knobSize / 2 + knobPosition.y,
          left: size / 2 - knobSize / 2 + knobPosition.x,
          boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.5)' : '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />

      {/* 방향 표시 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="w-full h-full text-neutral-400/30"
          viewBox="0 0 100 100"
        >
          {/* 위 */}
          <path d="M50 20 L45 30 L55 30 Z" fill="currentColor" />
          {/* 아래 */}
          <path d="M50 80 L45 70 L55 70 Z" fill="currentColor" />
          {/* 왼쪽 */}
          <path d="M20 50 L30 45 L30 55 Z" fill="currentColor" />
          {/* 오른쪽 */}
          <path d="M80 50 L70 45 L70 55 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export default VirtualJoystick;
