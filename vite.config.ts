import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react-swc"
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    base: '/', // Always use root path for Netlify
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]'
        },
      },
    },
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    },
    define: {
      // Make environment variables available to the client
      'process.env.VITE_YOCO_PUBLIC_KEY': JSON.stringify(env.VITE_YOCO_PUBLIC_KEY || ''),
      // Always use the correct API base URL based on environment
      'process.env.API_BASE_URL': JSON.stringify(isProduction ? '/.netlify/functions' : '/api'),
      // Make the environment available to the client
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
})
