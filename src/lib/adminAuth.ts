import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

/**
 * 관리자 요청 여부 확인
 * Authorization: Bearer <ADMIN_API_KEY> 헤더가 일치해야 통과
 * ADMIN_API_KEY가 설정되지 않은 경우 항상 거부
 */
export function isAdminRequest(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;

  const provided = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(adminKey);
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
