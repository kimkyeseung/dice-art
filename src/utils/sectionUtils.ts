import type { GridState, SectionInfo, SectionLayout } from '@/types';

// 모바일에서 적절한 섹션 크기 (한 섹션당 최대 셀 수)
const MAX_CELLS_PER_SECTION = 2500; // 50x50

// 섹션당 최대 가로/세로 셀 수
const MAX_SECTION_DIMENSION = 50;

/**
 * 그리드 크기에 따라 최적의 섹션 분할 레이아웃을 계산합니다.
 *
 * @param gridWidth 그리드 가로 셀 개수
 * @param gridHeight 그리드 세로 셀 개수
 * @returns SectionLayout 또는 null (분할 불필요시)
 */
export function calculateSectionLayout(
  gridWidth: number,
  gridHeight: number
): SectionLayout | null {
  const totalCells = gridWidth * gridHeight;

  // 2500셀 이하면 분할 불필요
  if (totalCells <= MAX_CELLS_PER_SECTION) {
    return null;
  }

  // 가로/세로 각각 필요한 분할 수 계산
  const cols = Math.ceil(gridWidth / MAX_SECTION_DIMENSION);
  const rows = Math.ceil(gridHeight / MAX_SECTION_DIMENSION);

  // 섹션 정보 생성
  const sections: SectionInfo[][] = [];
  const sectionWidth = Math.ceil(gridWidth / cols);
  const sectionHeight = Math.ceil(gridHeight / rows);

  for (let row = 0; row < rows; row++) {
    const rowSections: SectionInfo[] = [];
    for (let col = 0; col < cols; col++) {
      const startRow = row * sectionHeight;
      const startCol = col * sectionWidth;
      const endRow = Math.min(startRow + sectionHeight, gridHeight);
      const endCol = Math.min(startCol + sectionWidth, gridWidth);

      rowSections.push({
        row,
        col,
        startRow,
        startCol,
        endRow,
        endCol,
        width: endCol - startCol,
        height: endRow - startRow,
      });
    }
    sections.push(rowSections);
  }

  return {
    rows,
    cols,
    sections,
    totalSections: rows * cols,
  };
}

/**
 * 현재 섹션에 해당하는 그리드 부분만 추출합니다.
 *
 * @param gridState 전체 그리드 상태
 * @param section 추출할 섹션 정보
 * @returns 섹션에 해당하는 부분 그리드
 */
export function extractSectionGrid(
  gridState: GridState,
  section: SectionInfo
): GridState {
  const sectionCells = gridState.cells
    .slice(section.startRow, section.endRow)
    .map(row => row.slice(section.startCol, section.endCol));

  return {
    cells: sectionCells,
    width: section.width,
    height: section.height,
  };
}

/**
 * 섹션 좌표를 전체 그리드 좌표로 변환합니다.
 *
 * @param sectionRow 섹션 내 행 인덱스
 * @param sectionCol 섹션 내 열 인덱스
 * @param section 현재 섹션 정보
 * @returns 전체 그리드에서의 좌표 [row, col]
 */
export function sectionToGridCoords(
  sectionRow: number,
  sectionCol: number,
  section: SectionInfo
): [number, number] {
  return [
    section.startRow + sectionRow,
    section.startCol + sectionCol,
  ];
}

/**
 * 섹션 인덱스를 1차원 인덱스로 변환합니다. (네비게이션용)
 *
 * @param row 섹션 행 인덱스
 * @param col 섹션 열 인덱스
 * @param cols 전체 열 개수
 * @returns 1차원 인덱스
 */
export function sectionToFlatIndex(row: number, col: number, cols: number): number {
  return row * cols + col;
}

/**
 * 1차원 인덱스를 섹션 좌표로 변환합니다.
 *
 * @param index 1차원 인덱스
 * @param cols 전체 열 개수
 * @returns [row, col]
 */
export function flatIndexToSection(index: number, cols: number): [number, number] {
  return [Math.floor(index / cols), index % cols];
}

/**
 * 섹션의 진행률을 계산합니다.
 *
 * @param gridState 전체 그리드 상태
 * @param section 섹션 정보
 * @returns 진행률 (0-100)
 */
export function calculateSectionProgress(
  gridState: GridState,
  section: SectionInfo
): number {
  let filled = 0;
  let total = 0;

  for (let row = section.startRow; row < section.endRow; row++) {
    for (let col = section.startCol; col < section.endCol; col++) {
      total++;
      if (gridState.cells[row][col].filledValue !== null) {
        filled++;
      }
    }
  }

  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

/**
 * 모든 섹션의 진행률을 계산합니다.
 *
 * @param gridState 전체 그리드 상태
 * @param layout 섹션 레이아웃
 * @returns 2D 배열로 된 각 섹션의 진행률
 */
export function calculateAllSectionProgress(
  gridState: GridState,
  layout: SectionLayout
): number[][] {
  return layout.sections.map(rowSections =>
    rowSections.map(section => calculateSectionProgress(gridState, section))
  );
}

/**
 * 다음/이전 섹션 인덱스를 반환합니다.
 *
 * @param currentRow 현재 섹션 행
 * @param currentCol 현재 섹션 열
 * @param layout 섹션 레이아웃
 * @param direction 이동 방향
 * @returns 새 섹션 좌표 [row, col] 또는 null (이동 불가)
 */
export function getAdjacentSection(
  currentRow: number,
  currentCol: number,
  layout: SectionLayout,
  direction: 'up' | 'down' | 'left' | 'right'
): [number, number] | null {
  let newRow = currentRow;
  let newCol = currentCol;

  switch (direction) {
    case 'up':
      newRow--;
      break;
    case 'down':
      newRow++;
      break;
    case 'left':
      newCol--;
      break;
    case 'right':
      newCol++;
      break;
  }

  if (newRow < 0 || newRow >= layout.rows || newCol < 0 || newCol >= layout.cols) {
    return null;
  }

  return [newRow, newCol];
}

/**
 * 섹션 레이블을 생성합니다. (예: "A1", "B2")
 *
 * @param row 섹션 행 인덱스
 * @param col 섹션 열 인덱스
 * @returns 섹션 레이블
 */
export function getSectionLabel(row: number, col: number): string {
  const rowLabel = String.fromCharCode(65 + row); // A, B, C, ...
  const colLabel = (col + 1).toString(); // 1, 2, 3, ...
  return `${rowLabel}${colLabel}`;
}
