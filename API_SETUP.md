# API Setup Guide

## Issue: 401 Unauthorized Error

The Edamam Food Database API **does not support direct browser requests** due to CORS (Cross-Origin Resource Sharing) restrictions. You must use the backend server to proxy requests to the Edamam API.

## Solution: Use Backend Server

### Step 1: Configure Backend Environment Variables

Create a `.env` file in the `backend` folder with your API keys:

```env
EDAMAM_APP_ID=439d52c9
EDAMAM_APP_KEY=038b7979492b01b8659bb7b6a616235f
SPOONACULAR_API_KEY=54ebf068957343939a24106c45a13f20

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173,http://localhost:3000,http://localhost:3001
```

### Step 2: Start the Backend Server

1. Navigate to the backend folder:
   ```powershell
   cd backend
   ```

2. Install dependencies (if not already done):
   ```powershell
   npm install
   ```

3. Start the server:
   ```powershell
   npm run dev
   ```

The backend server should now be running on `http://localhost:5000`

### Step 3: Frontend Configuration

The frontend code will automatically fall back to using the backend server when direct API calls fail due to CORS.

Make sure your root `.env` file has:
```env
VITE_API_URL=http://localhost:5000
```

### How It Works

1. The frontend first tries to call Edamam API directly
2. If it gets a 401/403 error (CORS), it automatically falls back to using the backend
3. The backend server makes the API call on your behalf and returns the results
4. This avoids CORS issues since server-to-server requests don't have CORS restrictions

### Troubleshooting

**Backend not starting?**
- Make sure you're in the `backend` folder
- Check that `backend/.env` exists with correct API keys
- Ensure port 5000 is not already in use

**Still getting 401 errors?**
- Verify your API keys are correct in `backend/.env`
- Make sure the backend server is running
- Check the browser console and backend terminal for error messages

**API keys invalid?**
- Visit [Edamam Developer Portal](https://developer.edamam.com/) to verify your keys
- Make sure you're using Food Database API keys, not Recipe API keys

## Spoonacular API

Spoonacular may also have CORS restrictions. If you encounter issues, the backend proxy will be used automatically as a fallback.

