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

  const knobSize = size * 0.4;
  const maxDistance = (size - knobSize) / 2;

  // 연속 이동을 위한 애니메이션 루프
  useEffect(() => {
    const animate = () => {
      if (isActive && (lastMoveRef.current.x !== 0 || lastMoveRef.current.y !== 0)) {
        // 속도 조절 (거리에 비례)
        const speed = 8;
        onMove(
          lastMoveRef.current.x * speed,
          lastMoveRef.current.y * speed
        );
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, onMove]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsActive(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      updateKnobPosition(e.clientX - centerX, e.clientY - centerY);
    }
  }, []);

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

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isActive) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      updateKnobPosition(e.clientX - centerX, e.clientY - centerY);
    }
  }, [isActive, updateKnobPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsActive(false);
    setKnobPosition({ x: 0, y: 0 });
    lastMoveRef.current = { x: 0, y: 0 };
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
