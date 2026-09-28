import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

import path from 'path';
import { defineConfig } from 'vite';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    // GitHub Pages repository path
    base: '/123/',

    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: 'autoUpdate',

        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
        ],

        manifest: {
          id: '/123/',
          name: 'نور الإيمان - القرآن الكريم والأذكار',
          short_name: 'نور الإيمان',
          description:
            'تطبيق شامل للقرآن الكريم، أذكار الصباح والمساء، أدعية السفر وجميع الأدعية اليومية والسبحة بدون إنترنت.',

          theme_color: '#064e3b',
          background_color: '#064e3b',

          display: 'standalone',

          start_url: '/123/',
          scope: '/123/',

          icons: [
            {
              src: '/123/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/123/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/123/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },

        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,

          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,woff,woff2,json}',
          ],
        },

        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',

      // Disable file watching when DISABLE_HMR is true.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {},
    },
  };
});
