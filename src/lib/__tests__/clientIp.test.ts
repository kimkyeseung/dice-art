/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { getClientIp, getClientIpHash } from '../clientIp';

function makeRequest(headers: Record<string, string>) {
  return new NextRequest('http://localhost/api', { headers });
}

describe('getClientIp', () => {
  it('x-forwarded-for의 첫 번째 IP 사용', () => {
    expect(getClientIp(makeRequest({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('1.1.1.1');
  });

  it('x-forwarded-for가 없으면 x-real-ip 사용', () => {
    expect(getClientIp(makeRequest({ 'x-real-ip': '3.3.3.3' }))).toBe('3.3.3.3');
  });

  it('둘 다 없으면 unknown', () => {
    expect(getClientIp(makeRequest({}))).toBe('unknown');
  });
});

describe('getClientIpHash', () => {
  const originalSalt = process.env.IP_HASH_SALT;

  afterEach(() => {
    process.env.IP_HASH_SALT = originalSalt;
  });

  it('원본 IP를 포함하지 않는 64자 해시', () => {
    const hash = getClientIpHash(makeRequest({ 'x-forwarded-for': '1.1.1.1' }));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('1.1.1.1');
  });

  it('같은 IP는 같은 해시, 다른 IP는 다른 해시', () => {
    const a = getClientIpHash(makeRequest({ 'x-forwarded-for': '1.1.1.1' }));
    const b = getClientIpHash(makeRequest({ 'x-forwarded-for': '1.1.1.1' }));
    const c = getClientIpHash(makeRequest({ 'x-forwarded-for': '2.2.2.2' }));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('솔트가 바뀌면 해시도 바뀜', () => {
    process.env.IP_HASH_SALT = 'salt-a';
    const a = getClientIpHash(makeRequest({ 'x-forwarded-for': '1.1.1.1' }));
    process.env.IP_HASH_SALT = 'salt-b';
    const b = getClientIpHash(makeRequest({ 'x-forwarded-for': '1.1.1.1' }));
    expect(a).not.toBe(b);
  });
});
