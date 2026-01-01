import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dice-art.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dice Art - 이미지를 주사위 모자이크 아트로 변환",
    template: "%s | Dice Art",
  },
  description:
    "이미지를 업로드하고 주사위 눈금으로 이루어진 독특한 모자이크 아트를 만들어보세요. 무료 온라인 주사위 아트 생성기로 나만의 픽셀 아트를 완성하고 갤러리에 공유하세요.",
  keywords: [
    "주사위 아트",
    "dice art",
    "모자이크 아트",
    "픽셀 아트",
    "이미지 변환",
    "아트 생성기",
    "무료 아트 도구",
    "온라인 아트",
    "주사위 그림",
    "dice mosaic",
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
      "이미지를 업로드하고 주사위 눈금으로 이루어진 독특한 모자이크 아트를 만들어보세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dice Art - 주사위 모자이크 아트 생성기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dice Art - 이미지를 주사위 모자이크 아트로 변환",
    description:
      "이미지를 업로드하고 주사위 눈금으로 이루어진 독특한 모자이크 아트를 만들어보세요.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dice Art",
  description:
    "이미지를 업로드하고 주사위 눈금으로 이루어진 독특한 모자이크 아트를 만들어보세요.",
  url: siteUrl,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  author: {
    "@type": "Person",
    name: "kimkyeseung",
    url: "https://github.com/kimkyeseung",
  },
  featureList: [
    "이미지를 주사위 모자이크로 변환",
    "다양한 그리드 크기 지원",
    "작품 갤러리 공유",
    "고해상도 이미지 다운로드",
  ],
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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
