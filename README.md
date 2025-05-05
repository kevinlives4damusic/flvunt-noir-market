# FLVUNT Noir Market

## Project info

A modern e-commerce platform for FLVUNT brand clothing and accessories.

## Technologies Used

This project is built with:

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui (Radix UI components) + Tailwind CSS
- **Backend**: Express.js (converted to serverless functions for GitHub Pages)
- **Database**: Supabase
- **Deployment**: GitHub Pages + Netlify Functions

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
# (See .env.example for required variables)

# Step 5: Start the development server
npm run dev
```

## GitHub Pages Deployment

This project has been configured to deploy to GitHub Pages. To deploy:

1. **Push your code to GitHub**:
   ```sh
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Set up GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Set the source to GitHub Actions

3. **Set up repository secrets**:
   - Go to Settings > Secrets and Variables > Actions
   - Add the following secrets:
     - `VITE_YOCO_PUBLIC_KEY`: Your Yoco public key

4. **Run the GitHub Action**:
   - The workflow will automatically run on push to the main branch
   - You can also manually trigger it from the Actions tab

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

Create a `.env.local` file with the following variables for local development:

```
VITE_YOCO_PUBLIC_KEY=your_yoco_public_key
```

## API Integration

The application uses Netlify Functions to handle server-side operations like payment processing. These functions are automatically deployed alongside the static site when using the GitHub Actions workflow.
