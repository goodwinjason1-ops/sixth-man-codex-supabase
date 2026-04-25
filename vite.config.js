import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'Emerald Lakers Club Portal',
        short_name: 'Lakers Portal',
        description: 'Basketball club management and player development tracking',
        theme_color: '#065f46',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: [],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      'firebase/app': fileURLToPath(new URL('./src/lib/firebaseCompat/app.js', import.meta.url)),
      'firebase/auth': fileURLToPath(new URL('./src/lib/firebaseCompat/auth.js', import.meta.url)),
      'firebase/firestore': fileURLToPath(new URL('./src/lib/firebaseCompat/firestore.js', import.meta.url)),
      'firebase/storage': fileURLToPath(new URL('./src/lib/firebaseCompat/storage.js', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-supabase': [
            '@supabase/supabase-js'
          ],
          'vendor-recharts': [
            'recharts'
          ],
          'vendor-chartjs': [
            'chart.js',
            'react-chartjs-2'
          ],
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          'vendor-icons': [
            'lucide-react'
          ],
          'vendor-utils': [
            'date-fns',
            'idb'
          ]
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
