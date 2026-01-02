import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from '../ModeToggle';
import type { GridMode } from '../Grid';

describe('ModeToggle', () => {
  describe('Rendering', () => {
    it('should render fill and pan mode buttons', () => {
      render(
        <ModeToggle mode="fill" onModeChange={jest.fn()} />
      );

      expect(screen.getByText('채우기')).toBeInTheDocument();
      expect(screen.getByText('이동')).toBeInTheDocument();
    });

    it('should have correct titles for accessibility', () => {
      render(
        <ModeToggle mode="fill" onModeChange={jest.fn()} />
      );

      expect(screen.getByTitle('주사위 채우기 모드')).toBeInTheDocument();
      expect(screen.getByTitle('영역 이동 모드')).toBeInTheDocument();
    });

    it('should be hidden on desktop (sm:hidden class)', () => {
      const { container } = render(
        <ModeToggle mode="fill" onModeChange={jest.fn()} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('sm:hidden');
    });
  });

  describe('Active State', () => {
    it('should highlight fill button when mode is fill', () => {
      render(
        <ModeToggle mode="fill" onModeChange={jest.fn()} />
      );

      const fillButton = screen.getByTitle('주사위 채우기 모드');
      const panButton = screen.getByTitle('영역 이동 모드');

      expect(fillButton.className).toContain('bg-blue-500');
      expect(fillButton.className).toContain('text-white');
      expect(panButton.className).not.toContain('bg-blue-500');
    });

    it('should highlight pan button when mode is pan', () => {
      render(
        <ModeToggle mode="pan" onModeChange={jest.fn()} />
      );

      const fillButton = screen.getByTitle('주사위 채우기 모드');
      const panButton = screen.getByTitle('영역 이동 모드');

      expect(panButton.className).toContain('bg-blue-500');
      expect(panButton.className).toContain('text-white');
      expect(fillButton.className).not.toContain('bg-blue-500');
    });
  });

  describe('Interaction', () => {
    it('should call onModeChange with "fill" when fill button is clicked', () => {
      const onModeChange = jest.fn();

      render(
        <ModeToggle mode="pan" onModeChange={onModeChange} />
      );

      const fillButton = screen.getByTitle('주사위 채우기 모드');
      fireEvent.click(fillButton);

      expect(onModeChange).toHaveBeenCalledTimes(1);
      expect(onModeChange).toHaveBeenCalledWith('fill');
    });

    it('should call onModeChange with "pan" when pan button is clicked', () => {
      const onModeChange = jest.fn();

      render(
        <ModeToggle mode="fill" onModeChange={onModeChange} />
      );

      const panButton = screen.getByTitle('영역 이동 모드');
      fireEvent.click(panButton);

      expect(onModeChange).toHaveBeenCalledTimes(1);
      expect(onModeChange).toHaveBeenCalledWith('pan');
    });

    it('should still call onModeChange when clicking already active mode', () => {
      const onModeChange = jest.fn();

      render(
        <ModeToggle mode="fill" onModeChange={onModeChange} />
      );

      const fillButton = screen.getByTitle('주사위 채우기 모드');
      fireEvent.click(fillButton);

      // Should still call even if already in fill mode
      expect(onModeChange).toHaveBeenCalledWith('fill');
    });
  });

  describe('Icons', () => {
    it('should render SVG icons for both modes', () => {
      const { container } = render(
        <ModeToggle mode="fill" onModeChange={jest.fn()} />
      );

      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBe(2);
    });
  });

  describe('Mode Type Safety', () => {
    it('should accept GridMode type values', () => {
      const modes: GridMode[] = ['fill', 'pan'];
      const onModeChange = jest.fn();

      modes.forEach((mode) => {
        const { unmount } = render(
          <ModeToggle mode={mode} onModeChange={onModeChange} />
        );
        unmount();
      });

      // No type errors should occur
      expect(true).toBe(true);
    });
  });
});
