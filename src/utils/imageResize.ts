/**
 * 이미지 리사이징 유틸리티
 * Canvas API를 사용하여 클라이언트에서 이미지 크기 조절
 */

export interface ResizedImages {
  thumbnail: string; // ~150px, 갤러리 목록용
  preview: string;   // ~600px, 상세 페이지용
  original: string;  // 원본, 다운로드용
}

const THUMBNAIL_SIZE = 150;
const PREVIEW_SIZE = 600;

/**
 * 이미지를 지정된 최대 크기로 리사이즈합니다.
 * 비율을 유지하면서 긴 쪽이 maxSize가 되도록 조절합니다.
 */
function resizeImage(
  sourceCanvas: HTMLCanvasElement,
  maxSize: number,
  quality: number = 0.8
): string {
  const { width, height } = sourceCanvas;

  // 이미 작은 경우 그대로 반환
  if (width <= maxSize && height <= maxSize) {
    return sourceCanvas.toDataURL('image/png');
  }

  // 비율 계산
  const ratio = Math.min(maxSize / width, maxSize / height);
  const newWidth = Math.round(width * ratio);
  const newHeight = Math.round(height * ratio);

  // 새 캔버스에 리사이즈하여 그리기
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  // 고품질 리사이징을 위한 설정
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

  // PNG로 변환 (품질 손실 없음)
  return canvas.toDataURL('image/png');
}

/**
 * base64 이미지 데이터를 Canvas로 변환합니다.
 */
function base64ToCanvas(base64: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
    img.src = base64;
  });
}

/**
 * 원본 이미지에서 thumbnail, preview, original 세 가지 버전을 생성합니다.
 */
export async function generateResizedImages(originalBase64: string): Promise<ResizedImages> {
  const canvas = await base64ToCanvas(originalBase64);

  return {
    thumbnail: resizeImage(canvas, THUMBNAIL_SIZE),
    preview: resizeImage(canvas, PREVIEW_SIZE),
    original: originalBase64,
  };
}

/**
 * Canvas에서 직접 세 가지 버전의 이미지를 생성합니다.
 * (renderGridToCanvas 결과를 직접 사용할 때)
 */
export function generateResizedImagesFromCanvas(canvas: HTMLCanvasElement): ResizedImages {
  return {
    thumbnail: resizeImage(canvas, THUMBNAIL_SIZE),
    preview: resizeImage(canvas, PREVIEW_SIZE),
    original: canvas.toDataURL('image/png'),
  };
}
