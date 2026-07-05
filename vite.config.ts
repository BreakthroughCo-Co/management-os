import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Raise warning threshold — 500 kB is the default, raise to 800 kB
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ── Vendor: React core ──────────────────────────────────────
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // ── Vendor: React Router ────────────────────────────────────
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }

          // ── Vendor: Recharts (charting library — large) ─────────────
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }

          // ── Vendor: Firebase ────────────────────────────────────────
          if (id.includes('node_modules/firebase/') ||
              id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }

          // ── Vendor: Radix UI primitives ─────────────────────────────
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }

          // ── Vendor: Zustand + React Hook Form + Zod ─────────────────
          if (id.includes('node_modules/zustand') ||
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod')) {
            return 'vendor-state';
          }

          // ── Vendor: Lucide icons ────────────────────────────────────
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }

          // ── Vendor: Remaining third-party deps ──────────────────────
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  }
})
