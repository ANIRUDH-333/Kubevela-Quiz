# Vercel Deployment Guide

This guide will help you deploy your Quiz application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it's a Vite project
5. Configure the following settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Configure Environment Variables

In the Vercel dashboard, go to your project settings and add these environment variables:

#### Required Environment Variables:
```
NODE_ENV=production
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_RANGE=Questions!A:G
```

#### For Google Sheets Integration:
```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

**Important**: For the `GOOGLE_SERVICE_ACCOUNT_KEY`, you need to:
1. Go to Google Cloud Console
2. Create a service account
3. Download the JSON key file
4. Copy the entire JSON content and paste it as the value (it should be a single line of JSON)

#### Alternative (for local file path):
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 4. Deploy via CLI (Alternative)

If you prefer using the CLI:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### 5. Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update your DNS settings as instructed

## Project Structure for Vercel

Your project is now configured with:

- **Frontend**: React + Vite (served as static files)
- **Backend**: Express.js (converted to serverless functions)
- **API Endpoints**: Available at `/api/*` routes
- **Environment**: Production-ready configuration

## API Endpoints

After deployment, your API will be available at:

- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/questions` - Get quiz questions
- `https://your-app.vercel.app/api/questions/stats` - Get question statistics
- `https://your-app.vercel.app/api/questions/refresh` - Refresh question cache
- `https://your-app.vercel.app/api/user-data` - Submit user data

## Local Development

For local development, you can still use:

```bash
# Frontend (from root directory)
npm run dev

# Backend (from backend directory)
cd backend
npm run dev
```

The configuration automatically detects the environment and uses the appropriate API URLs.

## Troubleshooting

### Common Issues:

1. **API calls fail**: Check that environment variables are set correctly in Vercel
2. **Google Sheets not working**: Ensure the service account key is properly formatted and has access to the spreadsheet
3. **Build fails**: Check that all dependencies are listed in package.json

### Checking Logs:

1. Go to your Vercel dashboard
2. Select your project
3. Click on "Functions" to see serverless function logs
4. Click on "Deployments" to see build logs

## Environment Variables Summary

Set these in your Vercel project settings:

```
NODE_ENV=production
GOOGLE_SPREADSHEET_ID=1nD6GiQNnyC4DkRUceIEAL4FrUrIuxJwvKnXEJ9N9hmo
GOOGLE_SHEETS_RANGE=Questions!A:G
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test API endpoints manually
4. Check Google Sheets permissions
