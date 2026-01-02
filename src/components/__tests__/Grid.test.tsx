import { render, screen, act, fireEvent } from '@testing-library/react';
import { Grid } from '../Grid';
import { GridState, DiceValue } from '@/types';

// PointerEvent 폴리필 (Jest/jsdom에서 지원하지 않음)
class MockPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 1;
    this.pointerType = params.pointerType ?? 'mouse';
  }
}

// @ts-expect-error - polyfill
global.PointerEvent = MockPointerEvent;

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

// 포인터 이벤트 생성 헬퍼
function createPointerEvent(type: string, clientX: number, clientY: number, options: Partial<PointerEventInit> = {}): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: 'touch',
    ...options,
  });
}

describe('Grid Pointer Events', () => {
  const cellSize = 24;
  const gap = 1;
  const padding = 1;

  // 셀 좌표를 클라이언트 좌표로 변환
  function getCellCenter(row: number, col: number) {
    const cellWithGap = cellSize + gap;
    const x = padding + col * cellWithGap + cellSize / 2;
    const y = padding + row * cellWithGap + cellSize / 2;
    return { x, y };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    // setPointerCapture와 releasePointerCapture 모킹
    Element.prototype.setPointerCapture = jest.fn();
    Element.prototype.releasePointerCapture = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Pointer Down', () => {
    it('should fill cell immediately on pointer down', async () => {
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

      const { x, y } = getCellCenter(2, 2);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y));
      });

      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, 4);
    });

    it('should not fill on right click', () => {
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

      const { x, y } = getCellCenter(0, 0);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y, { button: 2 }));
      });

      expect(onCellUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Pointer Move (Drag)', () => {
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

      // Start at (0, 0)
      const start = getCellCenter(0, 0);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', start.x, start.y));
      });

      // Move to (0, 2) - horizontal drag
      const end = getCellCenter(0, 2);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointermove', end.x, end.y));
      });

      // Should fill cells at (0,0), (0,1), (0,2) via Bresenham's line
      expect(onCellUpdate).toHaveBeenCalledWith(0, 0, 3);
      expect(onCellUpdate).toHaveBeenCalledWith(0, 1, 3);
      expect(onCellUpdate).toHaveBeenCalledWith(0, 2, 3);
    });

    it('should continue filling cells even when gridState updates during drag', () => {
      let currentGridState = createTestGridState(5, 5);

      const onCellUpdate = jest.fn().mockImplementation((row, col, value) => {
        currentGridState = {
          ...currentGridState,
          cells: currentGridState.cells.map((r, rIdx) =>
            rIdx === row
              ? r.map((c, cIdx) =>
                  cIdx === col ? { ...c, filledValue: value } : c
                )
              : r
          ),
        };
      });

      const { container, rerender } = render(
        <Grid
          gridState={currentGridState}
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

      // Start at (0, 0)
      const start = getCellCenter(0, 0);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', start.x, start.y));
      });

      // Rerender with updated state
      rerender(
        <Grid
          gridState={currentGridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      // Move to (0, 1)
      const mid = getCellCenter(0, 1);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointermove', mid.x, mid.y));
      });

      // Rerender with updated state
      rerender(
        <Grid
          gridState={currentGridState}
          selectedDice={3}
          onCellUpdate={onCellUpdate}
          cellSize={cellSize}
        />
      );

      jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 200, bottom: 200,
        width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
      });

      // Move to (0, 2)
      const end = getCellCenter(0, 2);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointermove', end.x, end.y));
      });

      // Should have filled all 3 cells despite state updates
      expect(onCellUpdate).toHaveBeenCalledWith(0, 0, 3);
      expect(onCellUpdate).toHaveBeenCalledWith(0, 1, 3);
      expect(onCellUpdate).toHaveBeenCalledWith(0, 2, 3);

      const uniqueCells = new Set(
        onCellUpdate.mock.calls
          .filter((call) => call[2] === 3)
          .map((call) => `${call[0]}-${call[1]}`)
      );
      expect(uniqueCells.size).toBe(3);
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

      const { x, y } = getCellCenter(1, 1);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y));
      });

      // Move within same cell (small movement)
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointermove', x + 2, y + 2));
      });

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointermove', x + 4, y + 4));
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

      const { x, y } = getCellCenter(2, 2);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y));
      });

      // Fast forward 500ms for long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should reset cell (call with null) because it was already filled
      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, null);
    });

    it('should NOT reset cell on long press if cell was empty at pointer down', () => {
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

      const { x, y } = getCellCenter(2, 2);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y));
      });

      // Cell should be filled immediately
      expect(onCellUpdate).toHaveBeenCalledWith(2, 2, 3);
      onCellUpdate.mockClear();

      // Fast forward 500ms for long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should NOT reset cell because it was empty at pointer down
      const resetCalls = onCellUpdate.mock.calls.filter(
        (call) => call[2] === null
      );
      expect(resetCalls.length).toBe(0);
    });

    it('should cancel long press on pointer move', () => {
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

      const start = getCellCenter(1, 1);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', start.x, start.y));
      });

      // Move before long press timeout
      act(() => {
        jest.advanceTimersByTime(200);
      });

      const end = getCellCenter(1, 2);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointermove', end.x, end.y));
      });

      // Complete the timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should NOT have reset the cell
      const resetCalls = onCellUpdate.mock.calls.filter(
        (call) => call[0] === 1 && call[1] === 1 && call[2] === null
      );
      expect(resetCalls.length).toBe(0);
    });
  });

  describe('Pointer Up', () => {
    it('should clean up state on pointer up', () => {
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

      const { x, y } = getCellCenter(0, 0);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y));
      });

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerup', x, y));
      });

      // Start a new pointer - should work independently
      onCellUpdate.mockClear();

      const { x: x2, y: y2 } = getCellCenter(3, 3);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x2, y2));
      });

      expect(onCellUpdate).toHaveBeenCalledWith(3, 3, 3);
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

      const { x, y } = getCellCenter(1, 1);

      // Quick tap: pointerdown -> wait 50ms -> pointerup
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y));
      });

      act(() => {
        jest.advanceTimersByTime(50);
      });

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerup', x, y));
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
      const start = getCellCenter(0, 0);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', start.x, start.y));
      });

      // Move to (2, 2) - diagonal
      const end = getCellCenter(2, 2);
      act(() => {
        grid.dispatchEvent(createPointerEvent('pointermove', end.x, end.y));
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

      const { x, y } = getCellCenter(0, 0);

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', x, y));
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
      const scaledX = (padding + 1 * (cellSize + gap) + cellSize / 2) * scale;
      const scaledY = (padding + 1 * (cellSize + gap) + cellSize / 2) * scale;

      act(() => {
        grid.dispatchEvent(createPointerEvent('pointerdown', scaledX, scaledY));
      });

      expect(onCellUpdate).toHaveBeenCalledWith(1, 1, 6);
    });
  });

  describe('Context Menu (Right Click Reset)', () => {
    it('should reset cell on context menu', () => {
      const gridState = createTestGridState(5, 5);
      gridState.cells[1][1].filledValue = 3;
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

      const { x, y } = getCellCenter(1, 1);

      act(() => {
        fireEvent.contextMenu(grid, { clientX: x, clientY: y });
      });

      expect(onCellUpdate).toHaveBeenCalledWith(1, 1, null);
    });
  });
});
