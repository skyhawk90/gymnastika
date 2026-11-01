import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.gymnastika.chrudim.cz',
  integrations: [sitemap({ filter: (page) => !page.includes('/statistiky/') })],
  trailingSlash: 'always',
  // WSL on /mnt/c delivers no file-change events, so the dev server has to poll
  vite: { server: { watch: { usePolling: true, interval: 300 } } },
});
