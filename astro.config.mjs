import { defineConfig } from 'astro/config';
import sitemap from './integrations/sitemap.mjs';

export default defineConfig({
  site: 'https://cryptgregresearch.org',
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
});
