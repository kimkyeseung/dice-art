import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dice-art.vercel.app';

export const metadata: Metadata = {
  title: '갤러리',
  description: 'Dice Art로 만든 멋진 주사위 모자이크 아트 작품들을 감상하세요. 다른 사용자들이 공유한 창작 작품을 둘러보고 영감을 얻어보세요.',
  openGraph: {
    title: '갤러리 | Dice Art',
    description: 'Dice Art로 만든 멋진 주사위 모자이크 아트 작품들을 감상하세요.',
    url: `${siteUrl}/gallery`,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dice Art 갤러리 - 주사위 모자이크 아트 작품들',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '갤러리 | Dice Art',
    description: 'Dice Art로 만든 멋진 주사위 모자이크 아트 작품들을 감상하세요.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: `${siteUrl}/gallery`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Dice Art 갤러리',
  description: 'Dice Art로 만든 주사위 모자이크 아트 작품 갤러리',
  url: `${siteUrl}/gallery`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Dice Art',
    url: siteUrl,
  },
  about: {
    '@type': 'Thing',
    name: '주사위 모자이크 아트',
  },
  inLanguage: 'ko',
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
