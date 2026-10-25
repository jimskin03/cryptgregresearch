// @ts-nocheck
// Minimal, dependency-free sitemap: written after the build from the exact list
// of pages Astro generated, so new pages (e.g. a new project) are picked up
// automatically. Endpoints with a file extension (.json, .txt), the 404 page,
// and the OAuth hand-off page are excluded.
import { writeFile } from 'node:fs/promises';

const EXCLUDE = [/^404\/?$/, /^oauth\//];

export default function sitemap() {
  let site;
  return {
    name: 'cgr-sitemap',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        if (!site) throw new Error('cgr-sitemap: `site` must be set in astro.config.mjs');
        const urls = pages
          .map(({ pathname }) => pathname.replace(/^\/+/, ''))
          .filter((path) => !/\.[a-z0-9]+\/?$/i.test(path))
          .filter((path) => !EXCLUDE.some((re) => re.test(path)))
          .map((path) => (path === '' || path.endsWith('/') ? path : `${path}/`))
          .map((path) => new URL(path, site).href);
        const unique = [...new Set(urls)].sort();
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')}\n</urlset>\n`;
        await writeFile(new URL('sitemap.xml', dir), xml);
        logger.info(`wrote sitemap.xml with ${unique.length} URLs`);
      },
    },
  };
}
