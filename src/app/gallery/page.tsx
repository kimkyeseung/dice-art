import Link from 'next/link';
import { Metadata } from 'next';
import { getArtworks } from '@/lib/artworkStore';
import { Header } from '@/components/Header';
import { GalleryClient } from './GalleryClient';
import { prisma } from '@/lib/prisma';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dice-art.kimkyeseung.com';
const ITEMS_PER_PAGE = 12;

interface GalleryPageProps {
  searchParams: Promise<{ page?: string }>;
}

// 동적 메타데이터 생성 (페이지네이션 SEO)
export async function generateMetadata({ searchParams }: GalleryPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // 전체 개수 조회
  const total = await prisma.artwork.count();
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const title = page === 1 ? '갤러리' : `갤러리 - ${page}페이지`;
  const description = page === 1
    ? 'Dice Art로 만든 멋진 주사위 모자이크 아트 작품들을 감상하세요. 다른 사용자들이 공유한 창작 작품을 둘러보고 영감을 얻어보세요.'
    : `Dice Art 갤러리 ${page}페이지. 총 ${total}개의 주사위 모자이크 아트 작품을 감상하세요.`;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title: `${title} | Dice Art`,
      description,
      url: page === 1 ? `${siteUrl}/gallery` : `${siteUrl}/gallery?page=${page}`,
    },
    alternates: {
      canonical: page === 1 ? `${siteUrl}/gallery` : `${siteUrl}/gallery?page=${page}`,
    },
  };

  // rel prev/next 링크 추가
  const otherLinks: Array<{ rel: string; url: string }> = [];

  if (page > 1) {
    const prevPage = page - 1;
    const prevUrl = prevPage === 1 ? `${siteUrl}/gallery` : `${siteUrl}/gallery?page=${prevPage}`;
    otherLinks.push({ rel: 'prev', url: prevUrl });
  }

  if (page < totalPages) {
    otherLinks.push({ rel: 'next', url: `${siteUrl}/gallery?page=${page + 1}` });
  }

  if (otherLinks.length > 0) {
    metadata.other = otherLinks.reduce((acc, link) => {
      acc[`link:${link.rel}`] = link.url;
      return acc;
    }, {} as Record<string, string>);
  }

  return metadata;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // 서버에서 직접 데이터 fetch
  const { artworks, total, hasMore } = await getArtworks(page, 12);

  return (
    <div className="min-h-screen mesh-gradient flex flex-col">
      <Header
        rightContent={
          <Link href="/?upload=true" className="btn-primary text-sm">
            시작하기
          </Link>
        }
      />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-8 flex-1">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">갤러리</h1>
          {total > 0 && (
            <p className="text-neutral-500 mt-1">{total}개의 작품</p>
          )}
        </div>

        {/* 빈 상태 */}
        {artworks.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-700 mb-2">
              아직 공유된 작품이 없습니다
            </h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
              첫 번째 작품을 만들어 갤러리에 공유해 보세요!
            </p>
            <Link
              href="/?upload=true"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              시작하기
            </Link>
          </div>
        )}

        {/* 작품 그리드 + 클라이언트 상호작용 */}
        {artworks.length > 0 && (
          <GalleryClient
            initialArtworks={artworks}
            initialPage={page}
            initialHasMore={hasMore}
            total={total}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-neutral-200/50 bg-white/50 backdrop-blur-sm">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 text-center text-sm text-neutral-400">
          &copy; {new Date().getFullYear()} kimkyeseung
        </div>
      </footer>
    </div>
  );
}
