import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [mdx()],
  site: 'https://rmfisher26.github.io',
  base: process.env.GITHUB_ACTIONS ? '/guppyfisher/' : '/',
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',
      langs: ['python', 'rust', 'bash', 'json'],
    },
  },
});
