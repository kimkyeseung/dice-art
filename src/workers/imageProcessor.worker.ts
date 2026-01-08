// Web Worker for image processing
// 이미지 처리를 메인 스레드에서 분리하여 UI 블로킹 방지

// Worker 내부에서는 path alias를 사용할 수 없으므로 타입을 직접 정의
type DiceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface CellState {
  targetValue: DiceValue;
  filledValue: DiceValue | null;
}

interface GridState {
  cells: CellState[][];
  width: number;
  height: number;
}

const MIN_GRID_SIZE = 10;
const MAX_GRID_SIZE = 200; // 4배까지 지원

interface ProcessImageMessage {
  type: 'processImage';
  imageData: ImageData;
  imageWidth: number;
  imageHeight: number;
  maxCells: number;
}

interface ProcessImageResult {
  type: 'processImageResult';
  gridState: GridState;
}

interface ErrorResult {
  type: 'error';
  message: string;
}

type WorkerMessage = ProcessImageMessage;
type WorkerResult = ProcessImageResult | ErrorResult;

function calculateGridDimensions(
  imageWidth: number,
  imageHeight: number,
  maxCells: number
): { width: number; height: number } {
  const aspectRatio = imageWidth / imageHeight;

  let gridWidth: number;
  let gridHeight: number;

  if (aspectRatio >= 1) {
    gridWidth = Math.min(Math.max(maxCells, MIN_GRID_SIZE), MAX_GRID_SIZE);
    gridHeight = Math.round(gridWidth / aspectRatio);
  } else {
    gridHeight = Math.min(Math.max(maxCells, MIN_GRID_SIZE), MAX_GRID_SIZE);
    gridWidth = Math.round(gridHeight * aspectRatio);
  }

  gridWidth = Math.max(gridWidth, MIN_GRID_SIZE);
  gridHeight = Math.max(gridHeight, MIN_GRID_SIZE);

  return { width: gridWidth, height: gridHeight };
}

function calculateLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function brightnessToJDiceValue(brightness: number): DiceValue {
  const normalized = Math.min(255, Math.max(0, brightness));
  const value = Math.floor((normalized / 255) * 7);
  return Math.min(6, value) as DiceValue;
}

function processImageData(
  imageData: ImageData,
  imageWidth: number,
  imageHeight: number,
  maxCells: number
): GridState {
  const dimensions = calculateGridDimensions(imageWidth, imageHeight, maxCells);
  const { width: gridWidth, height: gridHeight } = dimensions;

  // 이미지를 그리드 크기로 샘플링
  const scaleX = imageWidth / gridWidth;
  const scaleY = imageHeight / gridHeight;
  const pixels = imageData.data;

  const cells: CellState[][] = [];

  for (let y = 0; y < gridHeight; y++) {
    const row: CellState[] = [];
    for (let x = 0; x < gridWidth; x++) {
      // 해당 그리드 셀에 대응하는 원본 이미지 픽셀 위치
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const index = (srcY * imageWidth + srcX) * 4;

      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];

      const brightness = calculateLuminance(r, g, b);
      const diceValue = brightnessToJDiceValue(brightness);

      row.push({
        targetValue: diceValue,
        filledValue: null,
      });
    }
    cells.push(row);
  }

  return {
    cells,
    width: gridWidth,
    height: gridHeight,
  };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { data } = event;

  try {
    if (data.type === 'processImage') {
      const gridState = processImageData(
        data.imageData,
        data.imageWidth,
        data.imageHeight,
        data.maxCells
      );

      const result: ProcessImageResult = {
        type: 'processImageResult',
        gridState,
      };

      self.postMessage(result);
    }
  } catch (error) {
    const errorResult: ErrorResult = {
      type: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
    self.postMessage(errorResult);
  }
};

export {};
