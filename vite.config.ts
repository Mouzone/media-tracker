import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tsConfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-dark.svg', 'favicon-light.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Media Tracker',
        short_name: 'MediaTracker',
        description: 'Track your movies, TV shows, and books.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192x192.png?v=3', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png?v=3', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512x512.png?v=3',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Covers are content-addressed (every upload gets a unique filename), so
        // they can be cached indefinitely. This is what makes a repeat visit
        // render the whole grid with no image requests at all.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cover-images',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Firebase and React change far less often than app code; splitting them
        // out means an app-code deploy doesn't invalidate ~600 KB of vendor cache.
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-react': ['react', 'react-dom', '@tanstack/react-router'],
        },
      },
    },
  },
})
