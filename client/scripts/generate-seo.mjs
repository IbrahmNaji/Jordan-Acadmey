import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

const outDir = path.resolve('dist');
const env = loadEnv('production', process.cwd(), 'VITE_');
const siteUrl = (env.VITE_SITE_URL || process.env.VITE_SITE_URL || '').trim();
const routes = ['/', '/courses', '/marketplace', '/workshop', '/spare-parts', '/about', '/contact', '/faq', '/privacy', '/terms'];

let origin = '';
if (siteUrl) {
  let parsed;
  try {
    parsed = new URL(siteUrl);
  } catch {
    throw new Error('VITE_SITE_URL must be a valid absolute URL.');
  }
  const isLocal = ['localhost', '127.0.0.1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:')) {
    throw new Error('VITE_SITE_URL must use HTTPS, except for localhost development.');
  }
  origin = parsed.origin;
}

await mkdir(outDir, { recursive: true });
const robotsLines = ['User-agent: *', 'Allow: /', 'Disallow: /admin'];
if (origin) robotsLines.push('Sitemap: ' + origin + '/sitemap.xml');
await writeFile(path.join(outDir, 'robots.txt'), robotsLines.join('\n') + '\n', 'utf8');

if (origin) {
  const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  const entries = routes.map((route) => '  <url><loc>' + escapeXml(new URL(route, origin).href) + '</loc></url>').join('\n');
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries + '\n</urlset>\n';
  await writeFile(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log('Generated robots.txt and sitemap.xml using VITE_SITE_URL.');
} else {
  console.warn('VITE_SITE_URL is unset: generated robots.txt without a sitemap URL; set it for production builds.');
}
