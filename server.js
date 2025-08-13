import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_BASE_URL || 'http://localhost:5173';

// Remove legacy Yoco requirement

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Remove legacy Yoco checkout endpoint
app.post('/api/create-yoco-checkout', (_req, res) => {
  return res.status(410).json({ error: 'Legacy Yoco checkout disabled. Use Netlify Polar functions.' });
});

// Remove legacy Yoco webhook
app.post('/api/webhook', (_req, res) => {
  return res.status(410).json({ error: 'Legacy Yoco webhook disabled. Use Netlify Polar webhook.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Accepting requests from: ${clientOrigin}`);
});
