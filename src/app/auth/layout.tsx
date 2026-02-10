import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: 'Dice Art에 로그인하여 작품을 저장하고 공유하세요.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
