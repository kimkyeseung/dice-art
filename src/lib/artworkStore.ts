import { Artwork, ArtworkListItem, CreateArtworkRequest, GridState, Comment, CreateCommentRequest } from '@/types';
import prisma from './prisma';

// Prisma 모델을 API 타입으로 변환
function toArtwork(dbArtwork: {
  id: string;
  title: string;
  authorName: string;
  gridState: string;
  imageData: string;
  thumbnailData: string | null;
  previewData: string | null;
  width: number;
  height: number;
  likes: number;
  createdAt: Date;
}): Artwork {
  return {
    id: dbArtwork.id,
    title: dbArtwork.title,
    authorName: dbArtwork.authorName,
    gridState: JSON.parse(dbArtwork.gridState) as GridState,
    imageUrl: `/api/artworks/${dbArtwork.id}/image`,
    thumbnailUrl: `/api/artworks/${dbArtwork.id}/thumbnail`,
    previewUrl: `/api/artworks/${dbArtwork.id}/preview`,
    width: dbArtwork.width,
    height: dbArtwork.height,
    likes: dbArtwork.likes,
    createdAt: dbArtwork.createdAt.toISOString(),
  };
}

function toArtworkListItem(dbArtwork: {
  id: string;
  title: string;
  authorName: string;
  thumbnailData: string | null;
  imageData: string;
  width: number;
  height: number;
  likes: number;
  createdAt: Date;
}): ArtworkListItem {
  return {
    id: dbArtwork.id,
    title: dbArtwork.title,
    authorName: dbArtwork.authorName,
    thumbnailData: dbArtwork.thumbnailData || dbArtwork.imageData, // 하위 호환
    width: dbArtwork.width,
    height: dbArtwork.height,
    likes: dbArtwork.likes,
    createdAt: dbArtwork.createdAt.toISOString(),
  };
}

// 작품 생성
export async function createArtwork(request: CreateArtworkRequest): Promise<Artwork> {
  const artwork = await prisma.artwork.create({
    data: {
      title: request.title,
      authorName: request.authorName,
      gridState: JSON.stringify(request.gridState),
      imageData: request.imageData,
      thumbnailData: request.thumbnailData,
      previewData: request.previewData,
      width: request.gridState.width,
      height: request.gridState.height,
    },
  });

  return toArtwork(artwork);
}

// 작품 목록 조회
export async function getArtworks(
  page: number = 1,
  limit: number = 12,
  authorName?: string
): Promise<{ artworks: ArtworkListItem[]; total: number; hasMore: boolean }> {
  const skip = (page - 1) * limit;
  const where = authorName ? { authorName } : {};

  const [artworks, total] = await Promise.all([
    prisma.artwork.findMany({
      where,
      select: {
        id: true,
        title: true,
        authorName: true,
        thumbnailData: true,
        imageData: true, // thumbnailData 없는 경우 대비 (하위 호환)
        width: true,
        height: true,
        likes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.artwork.count({ where }),
  ]);

  return {
    artworks: artworks.map(toArtworkListItem),
    total,
    hasMore: skip + artworks.length < total,
  };
}

// 작품 상세 조회
export async function getArtwork(id: string): Promise<Artwork | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
  });

  if (!artwork) return null;

  return toArtwork(artwork);
}

// 작품 삭제
export async function deleteArtwork(id: string): Promise<boolean> {
  try {
    await prisma.artwork.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// 좋아요 증가
export async function likeArtwork(id: string): Promise<Artwork | null> {
  try {
    const artwork = await prisma.artwork.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    return toArtwork(artwork);
  } catch {
    return null;
  }
}

// 원본 이미지 데이터 조회 (다운로드용)
export async function getArtworkImage(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { imageData: true },
  });

  return artwork?.imageData || null;
}

// 썸네일 이미지 데이터 조회 (갤러리 목록용)
export async function getArtworkThumbnail(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { thumbnailData: true, imageData: true },
  });

  // thumbnailData가 없으면 원본 반환 (하위 호환)
  return artwork?.thumbnailData || artwork?.imageData || null;
}

// 미리보기 이미지 데이터 조회 (상세 페이지용)
export async function getArtworkPreview(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { previewData: true, imageData: true },
  });

  // previewData가 없으면 원본 반환 (하위 호환)
  return artwork?.previewData || artwork?.imageData || null;
}

// GridState 유효성 검사
export function validateGridState(gridState: unknown): gridState is GridState {
  if (!gridState || typeof gridState !== 'object') return false;

  const gs = gridState as Record<string, unknown>;

  if (typeof gs.width !== 'number' || typeof gs.height !== 'number') return false;
  if (!Array.isArray(gs.cells)) return false;

  // 셀 배열 검증
  for (const row of gs.cells) {
    if (!Array.isArray(row)) return false;
    for (const cell of row) {
      if (!cell || typeof cell !== 'object') return false;
      const c = cell as Record<string, unknown>;
      if (typeof c.targetValue !== 'number' || c.targetValue < 0 || c.targetValue > 6) return false;
      if (c.filledValue !== null && (typeof c.filledValue !== 'number' || c.filledValue < 0 || c.filledValue > 6)) return false;
    }
  }

  return true;
}

// CreateArtworkRequest 유효성 검사
export function validateCreateArtworkRequest(body: unknown): body is CreateArtworkRequest {
  if (!body || typeof body !== 'object') return false;

  const req = body as Record<string, unknown>;

  if (typeof req.title !== 'string' || req.title.trim().length === 0) return false;
  if (typeof req.authorName !== 'string' || req.authorName.trim().length === 0) return false;
  if (typeof req.imageData !== 'string' || !req.imageData.startsWith('data:image/')) return false;
  if (typeof req.thumbnailData !== 'string' || !req.thumbnailData.startsWith('data:image/')) return false;
  if (typeof req.previewData !== 'string' || !req.previewData.startsWith('data:image/')) return false;
  if (!validateGridState(req.gridState)) return false;

  return true;
}

// ===== 댓글 관련 함수 =====

// Prisma Comment를 API 타입으로 변환
function toComment(dbComment: {
  id: string;
  content: string;
  authorName: string;
  artworkId: string;
  createdAt: Date;
}): Comment {
  return {
    id: dbComment.id,
    content: dbComment.content,
    authorName: dbComment.authorName,
    artworkId: dbComment.artworkId,
    createdAt: dbComment.createdAt.toISOString(),
  };
}

// 댓글 생성
export async function createComment(
  artworkId: string,
  request: CreateCommentRequest
): Promise<Comment> {
  const comment = await prisma.comment.create({
    data: {
      content: request.content,
      authorName: request.authorName,
      artworkId,
    },
  });

  return toComment(comment);
}

// 댓글 목록 조회
export async function getComments(
  artworkId: string
): Promise<{ comments: Comment[]; total: number }> {
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { artworkId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count({ where: { artworkId } }),
  ]);

  return {
    comments: comments.map(toComment),
    total,
  };
}

// 댓글 삭제
export async function deleteComment(id: string): Promise<boolean> {
  try {
    await prisma.comment.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// CreateCommentRequest 유효성 검사
export function validateCreateCommentRequest(body: unknown): body is CreateCommentRequest {
  if (!body || typeof body !== 'object') return false;

  const req = body as Record<string, unknown>;

  if (typeof req.content !== 'string' || req.content.trim().length === 0) return false;
  if (typeof req.authorName !== 'string' || req.authorName.trim().length === 0) return false;
  if (req.content.length > 500) return false; // 최대 500자

  return true;
}
