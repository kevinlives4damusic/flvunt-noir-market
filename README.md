# FLVUNT Noir Market

## Project info

A modern e-commerce platform for FLVUNT brand clothing and accessories.

## Technologies Used

This project is built with:

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui (Radix UI components) + Tailwind CSS
- **Backend**: Netlify Functions (ESM) with optional Express dev server
- **Database**: Firebase (Firestore + Auth)
- **Payments**: Polar
- **Deployment**: Netlify (Functions + Static site)

## Local Development

To run this project locally, follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd flvunt-noir-market

# Step 3: Install the necessary dependencies
npm install

# Step 4: Create a .env.local file with required environment variables
# (Configure these in Netlify project settings for deploys)
#
# POLAR_API_KEY=your_polar_api_key
# POLAR_WEBHOOK_SECRET=your_shared_webhook_secret
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'  # optional for local Netlify dev

# Step 5: Start the development server
npm run dev
```

## Running with Netlify Dev

To run the frontend and functions locally behind a single dev server:

```sh
npm run dev:netlify
```

This proxies `/api/*` to Netlify functions.

## Project Structure

- `/src`: Frontend React application
  - `/components`: Reusable UI components
  - `/pages`: Application pages/routes
  - `/lib`: Utility functions and API clients
  - `/context`: React context providers
  - `/hooks`: Custom React hooks
- `/netlify/functions`: Serverless functions for backend operations
- `/public`: Static assets

## Environment Variables

Set these in local `.env` for Netlify dev and in Netlify project settings for deploys:

- `POLAR_API_KEY` – Polar API key (required)
- `POLAR_WEBHOOK_SECRET` – shared secret for webhook validation (recommended)
- `FIREBASE_SERVICE_ACCOUNT` – JSON for Firebase Admin (optional locally; recommended in Netlify for server-side writes)

## API Integration

The application uses Netlify Functions for server-side operations, including creating Polar checkouts and handling webhooks. Functions are in `netlify/functions/` and are exported as ESM.

### Serverless API

Endpoints (proxied under `/api/*` by `netlify.toml`):

- POST `/api/orders` — Create an order server-side. Body: `{ items: [{ product_id, quantity }], currency?, metadata? }`. Totals are computed from the product catalog to prevent tampering.
- POST `/api/create-polar-checkout` — Create Polar checkout. Accepts `metadata.idempotencyKey`; reuses pending payment if key matches.
- GET `/api/payments/:id` — Get payment status/details. Requires auth if `REQUIRE_AUTH=true`.
- POST `/api/refund-payment` — Admin-only refund. Body: `{ paymentId, amountInCents? }`.

Admin access: set `ADMIN_UIDS` to a comma-separated list of Firebase UIDs or add custom claim `admin: true` for operators.
