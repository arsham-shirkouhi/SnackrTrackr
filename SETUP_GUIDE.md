# Setup Guide for SnackerTrackr

## Quick Setup Checklist

### 1. Backend Setup ✅

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Create `.env` file:**
   - Copy `env.example` to `.env`
   - Add your API keys:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   EDAMAM_APP_ID=your_actual_edamam_app_id
   EDAMAM_APP_KEY=your_actual_edamam_app_key
   SPOONACULAR_API_KEY=your_actual_spoonacular_api_key
   ```

4. **Start backend server:**
   ```powershell
   npm run dev
   ```

   Should see: `🚀 Server running on port 5000`

### 2. Frontend Setup ✅

1. **In root directory, start frontend:**
   ```powershell
   npm run dev
   ```

   Should see: `➜  Local:   http://localhost:5173/`

### 3. Firebase Firestore Rules Setup ⚠️ IMPORTANT

The app needs Firestore security rules to work. Deploy them:

**Option A: Firebase Console (Easiest)**
1. Go to https://console.firebase.google.com/
2. Select your project: `snackrtrackr`
3. Go to **Firestore Database** → **Rules** tab
4. Copy contents from `firestore.rules` file
5. Paste and click **Publish**

**Option B: Firebase CLI**
```powershell
firebase deploy --only firestore:rules
```

### 4. Get API Keys

**Edamam (Food Search):**
1. Go to https://developer.edamam.com/
2. Sign up / Log in
3. Create a new application
4. Copy `Application ID` and `Application Key`

**Spoonacular (Recipe Search):**
1. Go to https://spoonacular.com/food-api
2. Sign up / Log in
3. Get your free API key from dashboard
4. Copy the API key

### 5. Verify Everything Works

1. ✅ Backend running: http://localhost:5000/api/health
2. ✅ Frontend running: http://localhost:5173
3. ✅ Firestore rules deployed
4. ✅ API keys added to `backend/.env`

## Common Issues

### "ERR_CONNECTION_REFUSED"
- Backend not running → Start with `cd backend && npm run dev`

### "Missing or insufficient permissions"
- Firestore rules not deployed → Deploy `firestore.rules` to Firebase Console

### "API keys not configured"
- Missing API keys → Add them to `backend/.env` file
- Restart backend server after adding keys

### "Port 5000 already in use"
- Another instance running → Change `PORT=5001` in `backend/.env`

## Testing

1. **Test Backend Health:**
   ```powershell
   curl http://localhost:5000/api/health
   ```

2. **Test Food Search:**
   - Open app at http://localhost:5173
   - Go to Meal Logger
   - Search for "chicken" in Foods mode
   - Should see results from Edamam

3. **Test Recipe Search:**
   - In Meal Logger
   - Switch to Recipes mode
   - Search for "pasta"
   - Should see results from Spoonacular

