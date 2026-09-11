import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://developer-tusharchauhan.github.io',
  base: '/professional-info',
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'aurora-x',
      wrap: false,
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Chivo',
      cssVariable: '--font-chivo',
      weights: ['400 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Azeret Mono',
      cssVariable: '--font-azeret',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
