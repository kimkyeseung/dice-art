/**
 * @jest-environment node
 */
import {
  isArtworkStorageUrl,
  likeArtwork,
  validateCreateCommentRequest,
} from '../artworkStore';
import prisma from '../prisma';

jest.mock('../prisma', () => {
  const client = {
    artwork: { findUnique: jest.fn(), update: jest.fn() },
    artworkLike: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  return { __esModule: true, default: client, prisma: client };
});

const mockedPrisma = prisma as unknown as {
  artwork: { findUnique: jest.Mock; update: jest.Mock };
  artworkLike: { create: jest.Mock };
  $transaction: jest.Mock;
};

describe('isArtworkStorageUrl', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const base = 'https://abc.supabase.co/storage/v1/object/public/artworks';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });

  it('우리 버킷의 공개 URL은 허용', () => {
    expect(isArtworkStorageUrl(`${base}/temp-123/thumbnail.png`)).toBe(true);
  });

  it('다른 도메인은 거부', () => {
    expect(isArtworkStorageUrl('https://evil.com/storage/v1/object/public/artworks/a.png')).toBe(false);
    expect(isArtworkStorageUrl('https://abc.supabase.co.evil.com/storage/v1/object/public/artworks/a.png')).toBe(false);
  });

  it('다른 버킷이나 경로는 거부', () => {
    expect(isArtworkStorageUrl('https://abc.supabase.co/storage/v1/object/public/other/a.png')).toBe(false);
    expect(isArtworkStorageUrl(`${base}/../other/a.png`)).toBe(false);
  });

  it('http, 문자열이 아닌 값, 잘못된 URL은 거부', () => {
    expect(isArtworkStorageUrl(`http://abc.supabase.co/storage/v1/object/public/artworks/a.png`)).toBe(false);
    expect(isArtworkStorageUrl(123)).toBe(false);
    expect(isArtworkStorageUrl('not a url')).toBe(false);
  });

  it('NEXT_PUBLIC_SUPABASE_URL이 없으면 거부', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(isArtworkStorageUrl(`${base}/a.png`)).toBe(false);
  });
});

describe('validateCreateCommentRequest', () => {
  it('정상 요청은 허용', () => {
    expect(validateCreateCommentRequest({ content: '멋져요', authorName: '홍길동' })).toBe(true);
  });

  it('작성자 이름이 50자를 넘으면 거부', () => {
    expect(validateCreateCommentRequest({ content: '멋져요', authorName: 'a'.repeat(51) })).toBe(false);
    expect(validateCreateCommentRequest({ content: '멋져요', authorName: 'a'.repeat(50) })).toBe(true);
  });

  it('댓글이 500자를 넘거나 비어 있으면 거부', () => {
    expect(validateCreateCommentRequest({ content: 'a'.repeat(501), authorName: '홍길동' })).toBe(false);
    expect(validateCreateCommentRequest({ content: '   ', authorName: '홍길동' })).toBe(false);
  });
});

describe('likeArtwork', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('작품이 없으면 null', async () => {
    mockedPrisma.artwork.findUnique.mockResolvedValue(null);
    await expect(likeArtwork('x', 'hash')).resolves.toBeNull();
    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('처음 누르면 좋아요 증가', async () => {
    mockedPrisma.artwork.findUnique.mockResolvedValue({ likes: 3 });
    mockedPrisma.$transaction.mockResolvedValue([{}, { likes: 4 }]);
    await expect(likeArtwork('x', 'hash')).resolves.toEqual({ likes: 4, alreadyLiked: false });
  });

  it('이미 누른 IP면 증가하지 않고 alreadyLiked', async () => {
    mockedPrisma.artwork.findUnique.mockResolvedValue({ likes: 3 });
    mockedPrisma.$transaction.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    await expect(likeArtwork('x', 'hash')).resolves.toEqual({ likes: 3, alreadyLiked: true });
  });

  it('그 외 DB 오류는 그대로 던짐', async () => {
    mockedPrisma.artwork.findUnique.mockResolvedValue({ likes: 3 });
    mockedPrisma.$transaction.mockRejectedValue(new Error('db down'));
    await expect(likeArtwork('x', 'hash')).rejects.toThrow('db down');
  });
});
