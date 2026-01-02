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
    it('should reset cell on long press', () => {
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

      // Should reset cell (call with null)
      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, null);
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
});
