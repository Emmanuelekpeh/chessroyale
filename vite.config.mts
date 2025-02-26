import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Matches the server's port finding logic
const DEFAULT_PORT = 3000;

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh is important for chess move updates
      fastRefresh: true,
    }),
    runtimeErrorOverlay(),
    themePlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      // Add chess-specific aliases
      "@chess": path.resolve(__dirname, "client", "src", "chess"),
      "@puzzles": path.resolve(__dirname, "client", "src", "puzzles"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
    // Optimize for chess piece SVGs and puzzle data
    assetsInlineLimit: 4096, // Inline small chess pieces
    rollupOptions: {
      output: {
        manualChunks: {
          'chess-vendor': ['chess.js'], // If you're using chess.js
          'puzzle-data': ['/puzzles/**/*'], // Group puzzle-related code
        },
      },
    },
  },
  server: {
    port: DEFAULT_PORT,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${DEFAULT_PORT + 1}`,
        changeOrigin: true,
      }
    },
    // Improved HMR for development
    hmr: {
      overlay: true,
      // Timeout increased for puzzle processing
      timeout: 5000,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      // Add chess-specific dependencies if you're using them
      'chess.js',
      '@chrisoakman/chessboardjs'
    ]
  },
  // Performance optimizations for chess calculations
  esbuild: {
    target: 'esnext',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
