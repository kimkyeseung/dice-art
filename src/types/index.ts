// 주사위 눈 값 (0-6, 0은 빈 면)
export type DiceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// 셀 상태: 숫자(아직 채워지지 않음) 또는 주사위(채워짐)
export interface CellState {
  targetValue: DiceValue; // 원본 이미지 기반 목표 값
  filledValue: DiceValue | null; // 사용자가 채운 주사위 값 (null = 아직 안 채움)
}

// 그리드 전체 상태
export interface GridState {
  cells: CellState[][];
  width: number; // 가로 셀 개수
  height: number; // 세로 셀 개수
}

// 작업 상태 (저장/복구용)
export interface WorkState {
  id: string;
  gridState: GridState;
  originalImageData: string; // base64 encoded
  createdAt: number;
  updatedAt: number;
}

// 작업 목록 항목 (메타데이터)
export interface WorkEntry {
  id: string;
  gridSize: string; // "50 × 50"
  progress: number; // 진행률 %
  createdAt: number;
  updatedAt: number;
}

// ===== API 타입 (Phase 7) =====

// 갤러리 작품
export interface Artwork {
  id: string;
  title: string;
  authorName: string;
  gridState: GridState;
  imageUrl: string; // 렌더링된 PNG 이미지 URL
  thumbnailUrl: string; // 썸네일 이미지 URL
  width: number;
  height: number;
  createdAt: string; // ISO 8601
  likes: number;
}

// 작품 목록 아이템 (썸네일용)
export interface ArtworkListItem {
  id: string;
  title: string;
  authorName: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  createdAt: string;
  likes: number;
}

// 작품 업로드 요청
export interface CreateArtworkRequest {
  title: string;
  authorName: string;
  gridState: GridState;
  imageData: string; // base64 encoded PNG
}

// 작품 목록 응답
export interface ArtworkListResponse {
  artworks: ArtworkListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// API 에러 응답
export interface ApiErrorResponse {
  error: string;
  message: string;
}

// ===== 섹션 분할 타입 =====

// 섹션 정보
export interface SectionInfo {
  row: number; // 섹션 행 인덱스 (0부터 시작)
  col: number; // 섹션 열 인덱스 (0부터 시작)
  startRow: number; // 그리드에서 시작 행
  startCol: number; // 그리드에서 시작 열
  endRow: number; // 그리드에서 끝 행 (exclusive)
  endCol: number; // 그리드에서 끝 열 (exclusive)
  width: number; // 섹션 너비 (셀 개수)
  height: number; // 섹션 높이 (셀 개수)
}

// 섹션 분할 설정
export interface SectionLayout {
  rows: number; // 세로로 나눈 섹션 수
  cols: number; // 가로로 나눈 섹션 수
  sections: SectionInfo[][]; // 2D 배열: sections[row][col]
  totalSections: number; // 전체 섹션 수
}
