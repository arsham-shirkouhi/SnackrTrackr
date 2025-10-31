# Firestore Security Rules Setup

## How to Deploy Firestore Security Rules

### Option 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`snackrtrackr`)
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents from `firestore.rules` file in this repository
6. Paste into the Firebase Console rules editor
7. Click **Publish** to deploy the rules

### Option 2: Firebase CLI

1. Install Firebase CLI (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Security Rules Overview

The rules allow:
- ✅ Users can read/write their own user profile
- ✅ Users can read/write their own daily tracking data
- ✅ Users can read/write their own food logs
- ✅ Users can read/write their own tracking defaults
- ✅ Users can read/write their own preferences
- ❌ Users cannot access other users' data
- ❌ All other collections are denied by default

## Testing the Rules

After deploying, test in your app:
1. Log in as a user
2. Try to fetch your tracking data - should work
3. Try to log a meal - should work
4. The Firebase Console will show any permission errors in real-time

