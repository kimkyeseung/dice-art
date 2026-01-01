import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 작업',
  description: '진행 중인 주사위 아트 작업들을 관리하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
