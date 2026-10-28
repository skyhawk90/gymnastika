import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gymnastika.musil-matej.workers.dev',
  integrations: [sitemap()],
  trailingSlash: 'always',
  // WSL on /mnt/c delivers no file-change events, so the dev server has to poll
  vite: { server: { watch: { usePolling: true, interval: 300 } } },
});
