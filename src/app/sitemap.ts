import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dice-art.kimkyeseung.com';

  try {
    // 최신 아트워크 날짜를 가져와서 gallery 페이지 lastModified로 사용
    const latestArtwork = await prisma.artwork.findFirst({
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const galleryLastModified = latestArtwork?.createdAt || new Date();

    const staticPages: MetadataRoute.Sitemap = [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${siteUrl}/gallery`,
        lastModified: galleryLastModified,
        changeFrequency: 'hourly',
        priority: 0.9,
      },
    ];

    // 전체 아트워크 가져오기 (제한 없음)
    const artworks = await prisma.artwork.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const artworkPages: MetadataRoute.Sitemap = artworks.map((artwork) => ({
      url: `${siteUrl}/gallery/${artwork.id}`,
      lastModified: artwork.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...artworkPages];
  } catch {
    // 에러 시 정적 페이지만 반환
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${siteUrl}/gallery`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
      },
    ];
  }
}
