import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
        // Exclude unused images from precache to save bandwidth
        globIgnores: ['**/images/dragon.png', '**/images/logo.png'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB — reduced after tree-shaking optimization
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: Firebase core + auth
          'vendor-firebase-core': [
            'firebase/app',
            'firebase/auth'
          ],
          // Vendor: Firestore (largest Firebase module)
          'vendor-firebase-firestore': [
            'firebase/firestore'
          ],
          // Vendor: Firebase storage
          'vendor-firebase-storage': [
            'firebase/storage'
          ],
          // Vendor: Recharts (larger charting lib)
          'vendor-recharts': [
            'recharts'
          ],
          // Vendor: Chart.js (used by coach/player only)
          'vendor-chartjs': [
            'chart.js',
            'react-chartjs-2'
          ],
          // Vendor: React core + router
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // Vendor: Icons
          'vendor-icons': [
            'lucide-react'
          ],
          // Vendor: Utilities
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
