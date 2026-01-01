import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 작품',
  description: '내가 만들고 공유한 주사위 모자이크 아트 작품들을 관리하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyArtworksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
