import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react-swc"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get the repository name from package.json or environment
  const repoName = process.env.REPOSITORY_NAME || 'flvunt-noir-market'
  
  return {
    plugins: [react()],
    // Base path for GitHub Pages: /<repository-name>/
    base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    },
    define: {
      // Pass environment variables to the client
      'process.env.VITE_YOCO_PUBLIC_KEY': JSON.stringify(env.VITE_YOCO_PUBLIC_KEY),
      // Add API URL for production vs development
      'process.env.API_BASE_URL': JSON.stringify(
        process.env.NODE_ENV === 'production' 
          ? `https://api.netlify.com/.netlify/functions` 
          : '/api'
      ),
    }
  }
})
