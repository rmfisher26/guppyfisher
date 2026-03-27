import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [mdx(), react()],
  site: 'https://guppyfisher.dev',
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',
      langs: ['python', 'rust', 'bash', 'json'],
    },
  },
});
