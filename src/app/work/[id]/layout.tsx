import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '작업 중',
  description: '주사위 아트 작업 중입니다.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
