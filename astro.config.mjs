import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [mdx()],
  site: 'https://guppyfisher.dev',
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',
      langs: ['python', 'rust', 'bash', 'json'],
    },
  },
});
