# FLVUNT Noir Market

## Project info

A modern e-commerce platform for FLVUNT brand clothing and accessories.

## Technologies Used

This project is built with:

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui (Radix UI components) + Tailwind CSS
- **Backend**: Netlify Functions (ESM) with optional Express dev server
- **Database**: Firebase (Firestore + Auth)
- **Payments**: Paystack
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
# PAYSTACK_SECRET_KEY=your_paystack_secret_key
# CLIENT_BASE_URL=http://localhost:5173  # Your frontend URL
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'  # optional for local Netlify dev
# REQUIRE_AUTH=true  # Set to true to require authentication for payment endpoints
# ADMIN_UIDS=user_id1,user_id2  # Comma-separated list of admin user IDs

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

- `PAYSTACK_SECRET_KEY` – Paystack secret key (required)
- `CLIENT_BASE_URL` – Your frontend URL (e.g., `https://yourdomain.com` or `http://localhost:5173` for local dev)
- `FIREBASE_SERVICE_ACCOUNT` – JSON for Firebase Admin (optional locally; recommended in Netlify for server-side writes)
- `REQUIRE_AUTH` – Set to `true` to require authentication for payment endpoints (optional, defaults to false)
- `ADMIN_UIDS` – Comma-separated list of Firebase user IDs with admin access (optional)

## API Integration

The application uses Netlify Functions for server-side operations, including creating Paystack checkouts and handling webhooks. Functions are in `netlify/functions/` and are exported as ESM.

### Serverless API

Endpoints (proxied under `/api/*` by `netlify.toml`):

- POST `/api/orders` — Create an order server-side. Body: `{ items: [{ product_id, quantity }], currency?, metadata? }`. Totals are computed from the product catalog to prevent tampering.
- POST `/api/paystack-init` — Create Paystack checkout. Body: `{ orderId, amountInCents, currency, successUrl?, cancelUrl?, failureUrl?, metadata?, idempotencyKey?, saveCard? }`. Accepts `idempotencyKey`; reuses pending payment if key matches.
- GET `/api/payments/:id` — Get payment status/details. Requires auth if `REQUIRE_AUTH=true`.
- POST `/api/paystack-webhook` — Paystack webhook endpoint for payment status updates (called by Paystack).
- POST `/api/refund-payment` — Admin-only refund. Body: `{ paymentId, amountInCents? }`.
- GET `/api/admin-list` — Admin-only list of orders or payments. Query params: `type=orders|payments`, `status?`, `id?`, `limit?`.
- POST `/api/admin-replay` — Admin-only replay payment status. Body: `{ checkout_id }`.
- POST `/api/admin-refund-mock` — Admin-only mock refund (for testing). Body: `{ paymentId, partial? }`.

Admin access: set `ADMIN_UIDS` to a comma-separated list of Firebase UIDs or add custom claim `admin: true` for operators.
