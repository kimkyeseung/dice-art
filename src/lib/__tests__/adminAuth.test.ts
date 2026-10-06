/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { isAdminRequest } from '../adminAuth';

function makeRequest(authorization?: string) {
  return new NextRequest('http://localhost/api/artworks/abc', {
    method: 'DELETE',
    headers: authorization ? { authorization } : {},
  });
}

describe('isAdminRequest', () => {
  const originalKey = process.env.ADMIN_API_KEY;

  afterEach(() => {
    process.env.ADMIN_API_KEY = originalKey;
  });

  it('ADMIN_API_KEY가 없으면 항상 거부', () => {
    delete process.env.ADMIN_API_KEY;
    expect(isAdminRequest(makeRequest('Bearer anything'))).toBe(false);
    expect(isAdminRequest(makeRequest('Bearer '))).toBe(false);
  });

  describe('ADMIN_API_KEY 설정 시', () => {
    beforeEach(() => {
      process.env.ADMIN_API_KEY = 'secret-key';
    });

    it('올바른 Bearer 토큰은 허용', () => {
      expect(isAdminRequest(makeRequest('Bearer secret-key'))).toBe(true);
    });

    it('헤더가 없으면 거부', () => {
      expect(isAdminRequest(makeRequest())).toBe(false);
    });

    it('잘못된 토큰은 거부', () => {
      expect(isAdminRequest(makeRequest('Bearer wrong-key!'))).toBe(false);
      expect(isAdminRequest(makeRequest('Bearer secret'))).toBe(false);
    });

    it('Bearer 접두사가 없으면 거부', () => {
      expect(isAdminRequest(makeRequest('secret-key'))).toBe(false);
    });
  });
});
