import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin_disabled/', '/verify-email-notice/'],
    },
    sitemap: 'https://lukucheck.lxmwaniky.me/sitemap.xml',
  };
}
