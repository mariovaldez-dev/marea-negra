import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marea-negra.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/carta', '/pedir', '/micuenta', '/privacidad'],
        disallow: ['/admin/', '/login/', '/api/', '/monitoring/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
