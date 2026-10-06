import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

/**
 * 요청자의 IP를 추출 (Vercel은 x-forwarded-for 첫 번째 값이 실제 클라이언트 IP)
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * 요청자 IP의 해시값 (원본 IP는 DB에 저장하지 않음)
 * IP_HASH_SALT를 설정하면 해시로부터 IP를 역추적하기 어려워짐
 */
export function getClientIpHash(request: NextRequest): string {
  const salt = process.env.IP_HASH_SALT || '';
  return createHash('sha256').update(salt + getClientIp(request)).digest('hex');
}
