import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dice-art.kimkyeseung.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/my-artworks', '/my-works', '/work/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
