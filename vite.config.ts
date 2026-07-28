import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // http-proxy's changeOrigin strips the Origin header, which
            // breaks Sanctum's EnsureFrontendRequestsAreStateful middleware
            // (it can't identify non-GET requests as stateful without it).
            // Restore the original Origin so Sanctum works for all methods.
            if (req.headers.origin) {
              proxyReq.setHeader('Origin', req.headers.origin);
            }
          });
        },
      },
      '/sanctum/csrf-cookie': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
