import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dice-art.kimkyeseung.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dice Art - 이미지를 주사위 모자이크 아트로 변환",
    template: "%s | Dice Art",
  },
  description:
    "Anna dice artworks에서 영감받은 주사위 아트 생성기. 이미지를 업로드하면 주사위 눈금으로 이루어진 모자이크 아트로 변환됩니다. 무료 온라인 도구로 나만의 dice mosaic 작품을 만들고 갤러리에 공유하세요.",
  keywords: [
    "주사위 아트",
    "dice art",
    "anna dice artworks",
    "anna dice art",
    "주사위 모자이크",
    "dice mosaic",
    "모자이크 아트",
    "픽셀 아트",
    "pixel art",
    "이미지 변환",
    "image to dice",
    "아트 생성기",
    "art generator",
    "무료 아트 도구",
    "온라인 아트",
    "주사위 그림",
    "dice picture",
    "dice portrait",
    "주사위 초상화",
    "DIY 아트",
    "핸드메이드 아트",
    "dice craft",
    "주사위 공예",
  ],
  authors: [{ name: "kimkyeseung", url: "https://github.com/kimkyeseung" }],
  creator: "kimkyeseung",
  publisher: "kimkyeseung",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "Dice Art",
    title: "Dice Art - 이미지를 주사위 모자이크 아트로 변환",
    description:
      "Anna dice artworks에서 영감받은 주사위 아트 생성기. 이미지를 dice mosaic으로 변환하고 나만의 작품을 만들어보세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dice Art - Anna dice artworks 스타일의 주사위 모자이크 아트 생성기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dice Art - 이미지를 주사위 모자이크 아트로 변환",
    description:
      "Anna dice artworks에서 영감받은 주사위 아트 생성기. 이미지를 dice mosaic으로 변환하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "art",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dice Art",
  url: siteUrl,
  logo: `${siteUrl}/android-chrome-512x512.png`,
  sameAs: [
    "https://github.com/kimkyeseung",
  ],
  founder: {
    "@type": "Person",
    name: "kimkyeseung",
    url: "https://github.com/kimkyeseung",
  },
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dice Art",
  alternateName: ["Dice Mosaic Generator", "주사위 아트 생성기"],
  description:
    "Anna dice artworks에서 영감받은 주사위 아트 생성기. 이미지를 주사위 눈금으로 이루어진 모자이크 아트로 변환합니다.",
  url: siteUrl,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  provider: {
    "@type": "Organization",
    name: "Dice Art",
    url: siteUrl,
  },
  author: {
    "@type": "Person",
    name: "kimkyeseung",
    url: "https://github.com/kimkyeseung",
  },
  isBasedOn: {
    "@type": "CreativeWork",
    name: "Anna Dice Artworks",
    url: "https://www.instagram.com/anna.dice.artworks/",
    creator: {
      "@type": "Person",
      name: "Anna",
      sameAs: "https://www.instagram.com/anna.dice.artworks/",
    },
  },
  featureList: [
    "이미지를 주사위 모자이크로 변환",
    "다양한 그리드 크기 지원 (30x30 ~ 100x100)",
    "작품 갤러리 공유",
    "고해상도 이미지 다운로드",
    "자동 저장 기능",
    "모바일 지원",
  ],
  screenshot: `${siteUrl}/og-image.png`,
  softwareVersion: "1.0.0",
  keywords: "dice art, anna dice artworks, 주사위 아트, dice mosaic, 모자이크 아트",
  inLanguage: "ko",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3289333115172248"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
