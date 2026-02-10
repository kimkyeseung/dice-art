import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dice-art.kimkyeseung.com';

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

// CollectionPage + ImageGallery 스키마
const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Dice Art 갤러리',
  description: 'Dice Art로 만든 주사위 모자이크 아트 작품 갤러리. 사용자들이 만든 주사위 모자이크 아트 작품을 감상하세요.',
  url: `${siteUrl}/gallery`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Dice Art',
    url: siteUrl,
  },
  about: {
    '@type': 'Thing',
    name: '주사위 모자이크 아트',
    description: '이미지를 주사위 눈금으로 표현한 모자이크 아트 작품',
  },
  mainEntity: {
    '@type': 'ImageGallery',
    name: 'Dice Art 작품 갤러리',
    description: '사용자들이 Dice Art로 만든 주사위 모자이크 아트 작품 모음',
    url: `${siteUrl}/gallery`,
  },
  inLanguage: 'ko',
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: '홈',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: '갤러리',
      item: `${siteUrl}/gallery`,
    },
  ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
