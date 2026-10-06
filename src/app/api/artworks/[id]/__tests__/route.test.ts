/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE } from '../route';
import { deleteArtwork } from '@/lib/artworkStore';

jest.mock('@/lib/artworkStore', () => ({
  getArtwork: jest.fn(),
  deleteArtwork: jest.fn(),
  likeArtwork: jest.fn(),
}));

const mockedDelete = deleteArtwork as jest.MockedFunction<typeof deleteArtwork>;

function callDelete(authorization?: string) {
  const request = new NextRequest('http://localhost/api/artworks/abc', {
    method: 'DELETE',
    headers: authorization ? { authorization } : {},
  });
  return DELETE(request, { params: Promise.resolve({ id: 'abc' }) });
}

describe('DELETE /api/artworks/[id]', () => {
  const originalKey = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_API_KEY = 'secret-key';
    mockedDelete.mockReset();
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = originalKey;
  });

  it('인증 없이 호출하면 401이고 삭제하지 않음', async () => {
    const response = await callDelete();
    expect(response.status).toBe(401);
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('잘못된 키로 호출하면 401이고 삭제하지 않음', async () => {
    const response = await callDelete('Bearer wrong-key!');
    expect(response.status).toBe(401);
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('관리자 키로 호출하면 삭제 후 204', async () => {
    mockedDelete.mockResolvedValue(true);
    const response = await callDelete('Bearer secret-key');
    expect(response.status).toBe(204);
    expect(mockedDelete).toHaveBeenCalledWith('abc');
  });

  it('관리자 키로 없는 작품을 삭제하면 404', async () => {
    mockedDelete.mockResolvedValue(false);
    const response = await callDelete('Bearer secret-key');
    expect(response.status).toBe(404);
  });
});
