import { supabase, STORAGE_BUCKET, getPublicUrl, isStorageConfigured } from '@/lib/supabase';

export interface UploadedImages {
  thumbnailUrl: string;
  previewUrl: string;
  originalUrl: string;
}

/**
 * Base64 이미지 데이터를 Blob으로 변환
 */
function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',');
  const mimeMatch = header.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 이미지를 Supabase Storage에 업로드
 */
async function uploadImage(
  blob: Blob,
  artworkId: string,
  type: 'thumbnail' | 'preview' | 'original'
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const extension = blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `${artworkId}/${type}.${extension}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload ${type}: ${error.message}`);
  }

  return getPublicUrl(path);
}

/**
 * 3종 이미지를 모두 Supabase Storage에 업로드
 */
export async function uploadArtworkImages(
  artworkId: string,
  images: {
    thumbnail: string; // base64
    preview: string;   // base64
    original: string;  // base64
  }
): Promise<UploadedImages> {
  if (!isStorageConfigured()) {
    throw new Error('Supabase Storage is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const thumbnailBlob = base64ToBlob(images.thumbnail);
  const previewBlob = base64ToBlob(images.preview);
  const originalBlob = base64ToBlob(images.original);

  const [thumbnailUrl, previewUrl, originalUrl] = await Promise.all([
    uploadImage(thumbnailBlob, artworkId, 'thumbnail'),
    uploadImage(previewBlob, artworkId, 'preview'),
    uploadImage(originalBlob, artworkId, 'original'),
  ]);

  return {
    thumbnailUrl,
    previewUrl,
    originalUrl,
  };
}

/**
 * 작품의 이미지들을 Supabase Storage에서 삭제
 */
export async function deleteArtworkImages(artworkId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const paths = [
    `${artworkId}/thumbnail.png`,
    `${artworkId}/preview.png`,
    `${artworkId}/original.png`,
  ];

  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}

/**
 * Storage 설정 여부 재export
 */
export { isStorageConfigured };
