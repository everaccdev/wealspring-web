import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// Netlify sets URL to the site's primary domain at build time, so the
// domain lives in one place (Netlify › Domain management) until it's final.
export default defineConfig({
  output: 'hybrid',
  adapter: netlify(),
  site: process.env.URL || 'http://localhost:4321',
});
