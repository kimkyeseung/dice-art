# Dice Art

이미지를 주사위 모자이크 아트로 바꿔 주는 웹 앱입니다. 이미지를 올리면 밝기에 따라 각 칸에 들어갈 주사위 눈(0~6)이 정해지고, 사용자가 칸을 하나씩 채워 작품을 완성합니다. 완성한 작품은 갤러리에 공유할 수 있습니다.

[@anna.dice.artworks](https://www.instagram.com/anna.dice.artworks/)의 주사위 작품에서 영감을 받았습니다.

## 기술 스택

- Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS
- PostgreSQL (Neon) + Prisma: 갤러리 작품, 댓글, 좋아요 기록
- Supabase Storage: 갤러리 작품 이미지 (썸네일/미리보기/원본)
- localStorage: 작업 중인 작품 (서버에 저장하지 않음)

## 로컬 개발

```bash
npm install
cp .env.example .env   # 값 채우기 (아래 참고)
npx prisma db push     # DB 스키마 반영
npm run dev            # http://localhost:3000
```

### 환경변수

| 이름 | 필수 | 설명 |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres pooled 연결 문자열 |
| `DIRECT_URL` | ✅ | Postgres direct 연결 문자열 (마이그레이션용) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL. 작품 업로드 시 이 도메인의 `artworks` 버킷 URL만 허용됩니다 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `IP_HASH_SALT` | 권장 | 좋아요/댓글 제한에 쓰는 IP 해시 솔트. 한 번 정하면 바꾸지 마세요 |
| `ADMIN_API_KEY` | 선택 | 작품 삭제 API용 관리자 키. 비어 있으면 삭제 API는 항상 거부됩니다 |

키 생성 예: `openssl rand -hex 32`

### Supabase Storage

`artworks`라는 이름의 **public** 버킷이 필요합니다. 업로드 경로는 `<작품 임시 ID>/{thumbnail,preview,original}.png`입니다.

## 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # prisma generate + 프로덕션 빌드
npm run lint       # ESLint
npm test           # Jest 단위 테스트
npm run test:e2e   # Playwright E2E 테스트 (dev 서버 자동 실행)
```

## 갤러리 보호 정책

- **작품 삭제**: `DELETE /api/artworks/[id]`는 `Authorization: Bearer <ADMIN_API_KEY>` 헤더가 있어야 합니다.

  ```bash
  curl -X DELETE -H "Authorization: Bearer <키>" https://<도메인>/api/artworks/<id>
  ```

- **좋아요**: 작품당 IP 1회 (IP는 솔트를 붙인 SHA-256 해시로만 저장)
- **댓글**: IP당 1분에 5개까지, 작성자 이름 50자·내용 500자 제한
- **업로드 URL**: 우리 Supabase `artworks` 버킷의 공개 URL만 허용

## 배포

Vercel에 배포합니다. 스키마를 바꾼 경우 배포 **전에** `npx prisma db push`로 운영 DB에 먼저 반영하세요 (빌드는 `prisma generate`만 실행합니다).
