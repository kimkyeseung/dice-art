import { Artwork, ArtworkListItem, GridState, Comment, CreateCommentRequest } from '@/types';
import prisma from './prisma';

// 새로운 작품 생성 요청 타입 (URL 기반)
export interface CreateArtworkWithUrlsRequest {
  title: string;
  authorName: string;
  gridState: GridState;
  imageUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
  userId?: string;  // 로그인한 사용자의 경우 userId 포함
}

// DB 모델 타입
interface DbArtwork {
  id: string;
  title: string;
  authorName: string;
  gridState: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  imageData: string | null;
  thumbnailData: string | null;
  previewData: string | null;
  width: number;
  height: number;
  likes: number;
  createdAt: Date;
}

// Prisma 모델을 API 타입으로 변환
function toArtwork(dbArtwork: DbArtwork): Artwork {
  // 새 URL 필드 우선, 없으면 레거시 API 엔드포인트 사용
  const hasUrls = dbArtwork.imageUrl && dbArtwork.thumbnailUrl && dbArtwork.previewUrl;

  return {
    id: dbArtwork.id,
    title: dbArtwork.title,
    authorName: dbArtwork.authorName,
    gridState: JSON.parse(dbArtwork.gridState) as GridState,
    imageUrl: hasUrls ? dbArtwork.imageUrl! : `/api/artworks/${dbArtwork.id}/image`,
    thumbnailUrl: hasUrls ? dbArtwork.thumbnailUrl! : `/api/artworks/${dbArtwork.id}/thumbnail`,
    previewUrl: hasUrls ? dbArtwork.previewUrl! : `/api/artworks/${dbArtwork.id}/preview`,
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
  thumbnailUrl: string | null;
  thumbnailData: string | null;
  width: number;
  height: number;
  likes: number;
  createdAt: Date;
}): ArtworkListItem {
  // 새 URL 필드 우선, 없으면 레거시 API 엔드포인트 사용
  const thumbnailUrl = dbArtwork.thumbnailUrl || `/api/artworks/${dbArtwork.id}/thumbnail`;

  return {
    id: dbArtwork.id,
    title: dbArtwork.title,
    authorName: dbArtwork.authorName,
    thumbnailUrl,
    width: dbArtwork.width,
    height: dbArtwork.height,
    likes: dbArtwork.likes,
    createdAt: dbArtwork.createdAt.toISOString(),
  };
}

// 작품 생성 (URL 기반 - 새로운 방식)
export async function createArtwork(request: CreateArtworkWithUrlsRequest): Promise<Artwork> {
  const artwork = await prisma.artwork.create({
    data: {
      title: request.title,
      authorName: request.authorName,
      gridState: JSON.stringify(request.gridState),
      imageUrl: request.imageUrl,
      thumbnailUrl: request.thumbnailUrl,
      previewUrl: request.previewUrl,
      width: request.gridState.width,
      height: request.gridState.height,
      userId: request.userId,  // 로그인한 사용자 연결
    },
  });

  return toArtwork(artwork as DbArtwork);
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
        thumbnailUrl: true,
        thumbnailData: true, // 레거시 지원
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

  return toArtwork(artwork as DbArtwork);
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
    return toArtwork(artwork as DbArtwork);
  } catch {
    return null;
  }
}

// ===== 레거시 이미지 데이터 조회 (하위 호환용) =====

// 원본 이미지 데이터 조회 (다운로드용)
export async function getArtworkImage(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { imageData: true, imageUrl: true },
  });

  // URL이 있으면 null 반환 (리다이렉트 처리 필요)
  if (artwork?.imageUrl) return null;
  return artwork?.imageData || null;
}

// 원본 이미지 URL 조회
export async function getArtworkImageUrl(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  return artwork?.imageUrl || null;
}

// 썸네일 이미지 데이터 조회 (갤러리 목록용)
export async function getArtworkThumbnail(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { thumbnailData: true, imageData: true, thumbnailUrl: true },
  });

  // URL이 있으면 null 반환 (리다이렉트 처리 필요)
  if (artwork?.thumbnailUrl) return null;
  return artwork?.thumbnailData || artwork?.imageData || null;
}

// 썸네일 URL 조회
export async function getArtworkThumbnailUrl(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { thumbnailUrl: true },
  });
  return artwork?.thumbnailUrl || null;
}

// 미리보기 이미지 데이터 조회 (상세 페이지용)
export async function getArtworkPreview(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { previewData: true, imageData: true, previewUrl: true },
  });

  // URL이 있으면 null 반환 (리다이렉트 처리 필요)
  if (artwork?.previewUrl) return null;
  return artwork?.previewData || artwork?.imageData || null;
}

// 미리보기 URL 조회
export async function getArtworkPreviewUrl(id: string): Promise<string | null> {
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { previewUrl: true },
  });
  return artwork?.previewUrl || null;
}

// ===== 유효성 검사 =====

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

// CreateArtworkWithUrlsRequest 유효성 검사
export function validateCreateArtworkRequest(body: unknown): body is CreateArtworkWithUrlsRequest {
  if (!body || typeof body !== 'object') return false;

  const req = body as Record<string, unknown>;

  if (typeof req.title !== 'string' || req.title.trim().length === 0) return false;
  if (typeof req.authorName !== 'string' || req.authorName.trim().length === 0) return false;
  if (typeof req.imageUrl !== 'string' || !req.imageUrl.startsWith('http')) return false;
  if (typeof req.thumbnailUrl !== 'string' || !req.thumbnailUrl.startsWith('http')) return false;
  if (typeof req.previewUrl !== 'string' || !req.previewUrl.startsWith('http')) return false;
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
      userId: request.userId,  // 로그인한 사용자 연결
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
