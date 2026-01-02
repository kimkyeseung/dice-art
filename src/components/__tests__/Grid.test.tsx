import { render, screen, act, waitFor } from '@testing-library/react';
import { Grid } from '../Grid';
import { GridState, DiceValue } from '@/types';

// 테스트용 그리드 상태 생성
function createTestGridState(width: number, height: number): GridState {
  const cells = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      targetValue: 3 as DiceValue,
      filledValue: null,
    }))
  );
  return { cells, width, height };
}

// 터치 이벤트 생성 헬퍼
function createTouchEvent(type: string, clientX: number, clientY: number): TouchEvent {
  const touch = {
    clientX,
    clientY,
    identifier: 0,
    target: null as unknown as EventTarget,
    screenX: clientX,
    screenY: clientY,
    pageX: clientX,
    pageY: clientY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  };

  const touchList = {
    length: 1,
    item: (index: number) => index === 0 ? touch : null,
    [0]: touch,
    [Symbol.iterator]: function* () { yield touch; },
  } as unknown as TouchList;

  const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
  Object.defineProperty(event, 'touches', { value: touchList });
  Object.defineProperty(event, 'targetTouches', { value: touchList });
  Object.defineProperty(event, 'changedTouches', { value: touchList });

  return event;
}

describe('Grid Touch Events', () => {
  const cellSize = 24;
  const gap = 1;
  const padding = 1;

  // 셀 좌표를 클라이언트 좌표로 변환
  function getCellCenter(row: number, col: number, rect: DOMRect) {
    const cellWithGap = cellSize + gap;
    const x = rect.left + padding + col * cellWithGap + cellSize / 2;
    const y = rect.top + padding + row * cellWithGap + cellSize / 2;
    return { x, y };
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Touch Start', () => {
    it('should fill cell immediately on touch start', async () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={4}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      const rect = grid.getBoundingClientRect();

      // Mock getBoundingClientRect
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 200,
        bottom: 200,
        width: 200,
        height: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);
      const touchStartEvent = createTouchEvent('touchstart', x, y);

      act(() => {
        grid.dispatchEvent(touchStartEvent);
      });

      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, 4);
    });

    it('should prevent default on touch start to avoid scrolling', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={4}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(0, 0, { left: 0, top: 0 } as DOMRect);
      const touchStartEvent = createTouchEvent('touchstart', x, y);
      const preventDefaultSpy = jest.spyOn(touchStartEvent, 'preventDefault');

      act(() => {
        grid.dispatchEvent(touchStartEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Touch Move (Drag)', () => {
    it('should fill cells along the drag path', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      // Start touch at (0, 0)
      const start = getCellCenter(0, 0, { left: 0, top: 0 } as DOMRect);
      const touchStartEvent = createTouchEvent('touchstart', start.x, start.y);

      act(() => {
        grid.dispatchEvent(touchStartEvent);
      });

      // Move to (0, 2) - horizontal drag
      const end = getCellCenter(0, 2, { left: 0, top: 0 } as DOMRect);
      const touchMoveEvent = createTouchEvent('touchmove', end.x, end.y);

      act(() => {
        grid.dispatchEvent(touchMoveEvent);
      });

      // Should fill cells at (0,0), (0,1), (0,2) via Bresenham's line
      expect(onCellUpdate).toHaveBeenCalledWith(0, 0, 3);
      expect(onCellUpdate).toHaveBeenCalledWith(0, 1, 3);
      expect(onCellUpdate).toHaveBeenCalledWith(0, 2, 3);
    });

    it('should prevent default on touch move to avoid scrolling', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(0, 0, { left: 0, top: 0 } as DOMRect);

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      const touchMoveEvent = createTouchEvent('touchmove', x + 50, y);
      const preventDefaultSpy = jest.spyOn(touchMoveEvent, 'preventDefault');

      act(() => {
        grid.dispatchEvent(touchMoveEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not fill same cell multiple times during drag', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={2}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(1, 1, { left: 0, top: 0 } as DOMRect);

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      // Move within same cell (small movement)
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchmove', x + 2, y + 2));
      });

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchmove', x + 4, y + 4));
      });

      // onCellUpdate should only be called once for the same cell
      const callsForCell11 = onCellUpdate.mock.calls.filter(
        (call) => call[0] === 1 && call[1] === 1
      );
      expect(callsForCell11.length).toBe(1);
    });
  });

  describe('Long Press (Reset Cell)', () => {
    it('should reset cell on long press only if cell was already filled', () => {
      // Pre-fill cell (2, 2)
      const gridState = createTestGridState(5, 5);
      gridState.cells[2][2].filledValue = 5;

      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      // Fast forward 500ms for long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should reset cell (call with null) because it was already filled
      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, null);
    });

    it('should NOT reset cell on long press if cell was empty at touch start', () => {
      // Cell (2, 2) is empty (filledValue = null)
      const gridState = createTestGridState(5, 5);

      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      // Cell should be filled immediately
      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, 3);
      onCellUpdate.mockClear();

      // Fast forward 500ms for long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should NOT reset cell because it was empty at touch start
      const resetCalls = onCellUpdate.mock.calls.filter(
        (call) => call[2] === null
      );
      expect(resetCalls.length).toBe(0);
    });

    it('should cancel long press on touch move', () => {
      const gridState = createTestGridState(5, 5);
      gridState.cells[1][1].filledValue = 4;

      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const start = getCellCenter(1, 1, { left: 0, top: 0 } as DOMRect);

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', start.x, start.y));
      });

      // Move before long press timeout
      act(() => {
        jest.advanceTimersByTime(200);
      });

      const end = getCellCenter(1, 2, { left: 0, top: 0 } as DOMRect);
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchmove', end.x, end.y));
      });

      // Complete the timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should NOT have reset the cell (no call with null for cell 1,1)
      const resetCalls = onCellUpdate.mock.calls.filter(
        (call) => call[0] === 1 && call[1] === 1 && call[2] === null
      );
      expect(resetCalls.length).toBe(0);
    });
  });

  describe('Touch End', () => {
    it('should clean up state on touch end', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(0, 0, { left: 0, top: 0 } as DOMRect);

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchend', x, y));
      });

      // Start a new touch - should work independently
      onCellUpdate.mockClear();

      const { x: x2, y: y2 } = getCellCenter(3, 3, { left: 0, top: 0 } as DOMRect);
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x2, y2));
      });

      expect(onCellUpdate).toHaveBeenCalledWith(3, 3, 3);
    });

    it('should cancel long press timer on touch end (quick tap)', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);

      // Quick tap: touchstart -> wait 100ms -> touchend
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      // Cell should be filled
      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, 3);
      onCellUpdate.mockClear();

      // Wait 100ms (less than 500ms long press duration)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Touch end
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchend', x, y));
      });

      // Wait for remaining long press time + extra
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Cell should NOT be reset (timer should have been cancelled)
      const resetCalls = onCellUpdate.mock.calls.filter(
        (call) => call[2] === null
      );
      expect(resetCalls.length).toBe(0);
    });

    it('should only fill once on quick tap, not reset', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={4}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(1, 1, { left: 0, top: 0 } as DOMRect);

      // Simulate quick tap sequence
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      act(() => {
        jest.advanceTimersByTime(50);
      });

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchend', x, y));
      });

      // Run any pending timers
      act(() => {
        jest.runAllTimers();
      });

      // Should have exactly one fill call and no reset calls
      expect(onCellUpdate).toHaveBeenCalledTimes(1);
      expect(onCellUpdate).toHaveBeenCalledWith(1, 1, 4);
    });
  });

  describe('Diagonal Drag (Bresenham Line)', () => {
    it('should fill cells along diagonal path', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={1}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      // Start at (0, 0)
      const start = getCellCenter(0, 0, { left: 0, top: 0 } as DOMRect);
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', start.x, start.y));
      });

      // Move to (2, 2) - diagonal
      const end = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);
      act(() => {
        grid.dispatchEvent(createTouchEvent('touchmove', end.x, end.y));
      });

      // Should fill cells along the diagonal: (0,0), (1,1), (2,2)
      expect(onCellUpdate).toHaveBeenCalledWith(0, 0, 1);
      expect(onCellUpdate).toHaveBeenCalledWith(1, 1, 1);
      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, 1);
    });
  });

  describe('No Selected Dice', () => {
    it('should not fill cells when no dice is selected', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={null}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      const { x, y } = getCellCenter(0, 0, { left: 0, top: 0 } as DOMRect);

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', x, y));
      });

      expect(onCellUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Scale Support', () => {
    it('should correctly calculate cell position with scale', () => {
      const gridState = createTestGridState(5, 5);
      const onCellUpdate = jest.fn();
      const scale = 2;

      const { container } = render(
        <Grid
          gridState={gridState}
          selectedDice={6}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
          scale={scale}
        />
      );

      const grid = container.firstChild as HTMLElement;
      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 400, bottom: 400,
        width: 400, height: 400, x: 0, y: 0, toJSON: () => ({}),
      });

      // With scale=2, cell (1,1) center would be at scaled position
      // Original: padding + col * cellWithGap + cellSize/2 = 1 + 1*25 + 12 = 38
      // Scaled: 38 * 2 = 76
      const scaledX = (padding + 1 * (cellSize + gap) + cellSize / 2) * scale;
      const scaledY = (padding + 1 * (cellSize + gap) + cellSize / 2) * scale;

      act(() => {
        grid.dispatchEvent(createTouchEvent('touchstart', scaledX, scaledY));
      });

      expect(onCellUpdate).toHaveBeenCalledWith(1, 1, 6);
    });
  });

  describe('Grid Mode (Fill vs Pan)', () => {
    describe('Fill Mode (default)', () => {
      it('should fill cells on touch in fill mode', () => {
        const gridState = createTestGridState(5, 5);
        const onCellUpdate = jest.fn();

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={onCellUpdate}
            cellSize={cellSize}
            mode="fill"
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        const { x, y } = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);

        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', x, y));
        });

        expect(onCellUpdate).toHaveBeenCalledWith(2, 2, 4);
      });

      it('should have crosshair cursor in fill mode', () => {
        const gridState = createTestGridState(5, 5);

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={jest.fn()}
            cellSize={cellSize}
            mode="fill"
          />
        );

        const grid = container.firstChild as HTMLElement;
        expect(grid.className).toContain('cursor-crosshair');
        expect(grid.className).not.toContain('cursor-grab');
      });

      it('should prevent default on touch to avoid scrolling in fill mode', () => {
        const gridState = createTestGridState(5, 5);

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={jest.fn()}
            cellSize={cellSize}
            mode="fill"
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        const { x, y } = getCellCenter(0, 0, { left: 0, top: 0 } as DOMRect);
        const touchStartEvent = createTouchEvent('touchstart', x, y);
        const preventDefaultSpy = jest.spyOn(touchStartEvent, 'preventDefault');

        act(() => {
          grid.dispatchEvent(touchStartEvent);
        });

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('Pan Mode', () => {
      it('should NOT fill cells on touch in pan mode', () => {
        const gridState = createTestGridState(5, 5);
        const onCellUpdate = jest.fn();

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={onCellUpdate}
            cellSize={cellSize}
            mode="pan"
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        const { x, y } = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);

        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', x, y));
        });

        // Should NOT call onCellUpdate in pan mode
        expect(onCellUpdate).not.toHaveBeenCalled();
      });

      it('should have grab cursor in pan mode', () => {
        const gridState = createTestGridState(5, 5);

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={jest.fn()}
            cellSize={cellSize}
            mode="pan"
          />
        );

        const grid = container.firstChild as HTMLElement;
        expect(grid.className).toContain('cursor-grab');
        expect(grid.className).not.toContain('cursor-crosshair');
      });

      it('should call onPan callback during touch move in pan mode', () => {
        const gridState = createTestGridState(5, 5);
        const onPan = jest.fn();

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={jest.fn()}
            cellSize={cellSize}
            mode="pan"
            onPan={onPan}
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        // Start touch at (100, 100)
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', 100, 100));
        });

        // Move to (150, 120) - delta: (50, 20)
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchmove', 150, 120));
        });

        expect(onPan).toHaveBeenCalledWith(50, 20);
      });

      it('should accumulate pan deltas during continuous drag', () => {
        const gridState = createTestGridState(5, 5);
        const onPan = jest.fn();

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={jest.fn()}
            cellSize={cellSize}
            mode="pan"
            onPan={onPan}
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        // Start touch
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', 100, 100));
        });

        // First move: delta (30, 10)
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchmove', 130, 110));
        });

        // Second move: delta (20, 15) from previous position
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchmove', 150, 125));
        });

        expect(onPan).toHaveBeenCalledTimes(2);
        expect(onPan).toHaveBeenNthCalledWith(1, 30, 10);
        expect(onPan).toHaveBeenNthCalledWith(2, 20, 15);
      });

      it('should NOT trigger long press reset in pan mode', () => {
        const gridState = createTestGridState(5, 5);
        gridState.cells[2][2].filledValue = 5;
        const onCellUpdate = jest.fn();

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={3}
            onCellUpdate={onCellUpdate}
            cellSize={cellSize}
            mode="pan"
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        const { x, y } = getCellCenter(2, 2, { left: 0, top: 0 } as DOMRect);

        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', x, y));
        });

        // Wait for long press duration
        act(() => {
          jest.advanceTimersByTime(500);
        });

        // Should NOT reset cell in pan mode
        expect(onCellUpdate).not.toHaveBeenCalled();
      });

      it('should reset state on touch end in pan mode', () => {
        const gridState = createTestGridState(5, 5);
        const onPan = jest.fn();

        const { container } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={jest.fn()}
            cellSize={cellSize}
            mode="pan"
            onPan={onPan}
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        // Start and move
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', 100, 100));
        });
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchmove', 150, 120));
        });

        // End touch
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchend', 150, 120));
        });

        onPan.mockClear();

        // Start new touch - should calculate delta from new start position
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', 50, 50));
        });
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchmove', 80, 70));
        });

        // Delta should be from (50,50) not from previous touch position
        expect(onPan).toHaveBeenCalledWith(30, 20);
      });
    });

    describe('Mode Switching', () => {
      it('should switch between fill and pan modes', () => {
        const gridState = createTestGridState(5, 5);
        const onCellUpdate = jest.fn();
        const onPan = jest.fn();

        const { container, rerender } = render(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={onCellUpdate}
            cellSize={cellSize}
            mode="fill"
            onPan={onPan}
          />
        );

        const grid = container.firstChild as HTMLElement;
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        // Fill mode - should fill cell
        const { x, y } = getCellCenter(1, 1, { left: 0, top: 0 } as DOMRect);
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', x, y));
        });
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchend', x, y));
        });

        expect(onCellUpdate).toHaveBeenCalledWith(1, 1, 4);
        onCellUpdate.mockClear();

        // Switch to pan mode
        rerender(
          <Grid
            gridState={gridState}
            selectedDice={4}
            onCellUpdate={onCellUpdate}
            cellSize={cellSize}
            mode="pan"
            onPan={onPan}
          />
        );

        // Need to re-mock after rerender
        jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
          left: 0, top: 0, right: 200, bottom: 200,
          width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
        });

        // Pan mode - should NOT fill cell, should pan instead
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchstart', 100, 100));
        });
        act(() => {
          grid.dispatchEvent(createTouchEvent('touchmove', 150, 120));
        });

        expect(onCellUpdate).not.toHaveBeenCalled();
        expect(onPan).toHaveBeenCalledWith(50, 20);
      });
    });
  });
});
