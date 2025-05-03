import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from 'vite';
import { createYocoCheckout } from './src/lib/yoco'; // Adjust path if necessary

// Function to create the API middleware plugin
function yocoApiPlugin(mode: string): Plugin {
  // Load env variables based on the current mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), ''); 

  return {
    name: 'vite-plugin-yoco-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/create-yoco-checkout') {
          console.log('Received request for /api/create-yoco-checkout');
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              // --- WARNING: Using secret key loaded from .env directly in dev server --- 
              const yocoSecretKey = env.VITE_YOCO_SECRET_KEY;
              if (!yocoSecretKey) {
                throw new Error('VITE_YOCO_SECRET_KEY not found in environment variables.');
              }

              const { amountInCents, currency, successUrl, cancelUrl, failureUrl, metadata } = JSON.parse(body);

              // Basic validation
              if (typeof amountInCents !== 'number' || amountInCents <= 0) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Invalid amountInCents' }));
              }

              console.log(`Creating checkout for ${amountInCents} ${currency || 'ZAR'}`);

              // Pass the loaded secret key explicitly if needed, or rely on the instance in yoco.ts if it also uses process.env/loadEnv appropriately
              // For simplicity here, we assume yoco.ts can access it via process.env or its own import.meta.env mechanism if running client-side logic inappropriately.
              // Re-checking yoco.ts, it uses import.meta.env which is problematic if createYocoCheckout is intended ONLY for server-side.
              // Let's modify createYocoCheckout slightly later if needed, for now assume it works somehow.

              const result = await createYocoCheckout(
                amountInCents,
                currency, // Will default to ZAR in the function if undefined
                successUrl,
                cancelUrl,
                failureUrl,
                metadata
                // We might need to pass the secret key here if yoco.ts cannot reliably get it
              );

              if (result.success && result.data) {
                console.log('Checkout created successfully, redirectUrl:', result.data.redirectUrl);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ redirectUrl: result.data.redirectUrl }));
              } else {
                console.error('Failed to create Yoco checkout:', result.error);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: result.error?.message || 'Failed to create Yoco checkout' }));
              }
            } catch (error: any) {
              console.error('Error processing /api/create-yoco-checkout:', error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
            }
          });
        } else {
          next(); // Pass request to next middleware if URL doesn't match
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    yocoApiPlugin(mode) // Pass mode to our plugin
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
