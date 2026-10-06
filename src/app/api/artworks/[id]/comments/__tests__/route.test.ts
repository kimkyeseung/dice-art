/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { countRecentCommentsByIp, createComment } from '@/lib/artworkStore';

jest.mock('@/lib/artworkStore', () => ({
  ...jest.requireActual('@/lib/artworkStore'),
  countRecentCommentsByIp: jest.fn(),
  createComment: jest.fn(),
  getComments: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: {} }));

const mockedCount = countRecentCommentsByIp as jest.MockedFunction<typeof countRecentCommentsByIp>;
const mockedCreate = createComment as jest.MockedFunction<typeof createComment>;

function callPost(body: unknown) {
  const request = new NextRequest('http://localhost/api/artworks/abc/comments', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.1' },
    body: JSON.stringify(body),
  });
  return POST(request, { params: Promise.resolve({ id: 'abc' }) });
}

describe('POST /api/artworks/[id]/comments', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('제한 미만이면 댓글 작성', async () => {
    mockedCount.mockResolvedValue(4);
    mockedCreate.mockResolvedValue({
      id: 'c1',
      content: '멋져요',
      authorName: '홍길동',
      artworkId: 'abc',
      createdAt: new Date().toISOString(),
    });

    const response = await callPost({ content: '멋져요', authorName: '홍길동' });
    expect(response.status).toBe(201);
    expect(mockedCreate).toHaveBeenCalledWith(
      'abc',
      { content: '멋져요', authorName: '홍길동' },
      expect.stringMatching(/^[0-9a-f]{64}$/)
    );
  });

  it('1분에 5개 이상이면 429이고 작성하지 않음', async () => {
    mockedCount.mockResolvedValue(5);

    const response = await callPost({ content: '도배', authorName: '스패머' });
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('작성자 이름이 너무 길면 400', async () => {
    const response = await callPost({ content: '멋져요', authorName: 'a'.repeat(51) });
    expect(response.status).toBe(400);
    expect(mockedCount).not.toHaveBeenCalled();
  });
});
