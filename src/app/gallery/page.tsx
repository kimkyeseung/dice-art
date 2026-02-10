import Link from 'next/link';
import { getArtworks } from '@/lib/artworkStore';
import { Header } from '@/components/Header';
import { GalleryClient } from './GalleryClient';

interface GalleryPageProps {
  searchParams: Promise<{ page?: string }>;
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

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1">
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
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-neutral-400">
          &copy; {new Date().getFullYear()} kimkyeseung
        </div>
      </footer>
    </div>
  );
}
