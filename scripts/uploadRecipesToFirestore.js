import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') })

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Error: Firebase configuration not found in environment variables')
    console.error('Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc. in your .env file')
    process.exit(1)
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const RECIPES_FILE = path.join(__dirname, '..', 'public', 'recipes.json')
const BATCH_SIZE = 100 // Upload in batches to avoid overwhelming Firestore

async function authenticate() {
    const adminEmail = process.env.FIREBASE_ADMIN_EMAIL
    const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD

    if (adminEmail && adminPassword) {
        try {
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
            console.log('✓ Authenticated with Firebase')
            return true
        } catch (error) {
            console.error('❌ Authentication failed:', error.message)
            console.log('\n📝 To fix this:')
            console.log('   1. Add FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD to your .env file')
            console.log('   2. OR temporarily update Firestore rules to allow writes without authentication')
            console.log('      Change: allow write: if isAuthenticated()')
            console.log('      To:     allow write: if true')
            console.log('   3. After upload, change the rule back for security')
            return false
        }
    } else {
        console.warn('\n⚠️  No authentication credentials provided.')
        console.warn('📝 Add these to your .env file:')
        console.warn('   FIREBASE_ADMIN_EMAIL=your-email@example.com')
        console.warn('   FIREBASE_ADMIN_PASSWORD=your-password')
        console.warn('\n   OR temporarily update Firestore rules:')
        console.warn('   match /recipes/{recipeId} { allow write: if true; }')
        return false
    }
}

async function checkExistingRecipes() {
    try {
        const recipesRef = collection(db, 'recipes')
        const snapshot = await getDocs(recipesRef)
        return snapshot.size
    } catch (error) {
        console.error('Error checking existing recipes:', error.message)
        return 0
    }
}

async function uploadRecipes() {
    console.log('Starting recipe upload to Firestore...')
    console.log('Firebase Project:', firebaseConfig.projectId)
    console.log('')

    // Try to authenticate
    const authenticated = await authenticate()
    if (!authenticated) {
        console.log('\n⚠️  Proceeding without authentication. If upload fails, please:')
        console.log('   1. Add FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD to .env, OR')
        console.log('   2. Temporarily allow writes in Firestore rules')
        console.log('')
    }

    // Check how many recipes already exist
    const existingCount = await checkExistingRecipes()
    if (existingCount > 0) {
        console.log(`⚠️  Warning: ${existingCount} recipes already exist in Firestore`)
        console.log('This script will update existing recipes or add new ones.')
        console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...')
        await new Promise(resolve => setTimeout(resolve, 3000))
    }

    // Read recipes from JSON file
    let recipes
    try {
        const recipesData = await fs.readFile(RECIPES_FILE, 'utf-8')
        recipes = JSON.parse(recipesData)
        console.log(`\n✓ Loaded ${recipes.length} recipes from ${RECIPES_FILE}`)
    } catch (error) {
        console.error(`❌ Error reading recipes file: ${error.message}`)
        process.exit(1)
    }

    if (!Array.isArray(recipes) || recipes.length === 0) {
        console.error('❌ No recipes found in JSON file')
        process.exit(1)
    }

    const recipesRef = collection(db, 'recipes')
    let uploaded = 0
    let errors = 0

    // Upload in batches
    for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
        const batch = recipes.slice(i, i + BATCH_SIZE)
        console.log(`\nUploading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(recipes.length / BATCH_SIZE)} (recipes ${i + 1}-${Math.min(i + BATCH_SIZE, recipes.length)})`)

        for (const recipe of batch) {
            try {
                const recipeDoc = doc(recipesRef, recipe.id.toString())

                // Convert recipe to Firestore document format
                const recipeData = {
                    id: recipe.id,
                    title: recipe.title || '',
                    image: recipe.image || '',
                    readyInMinutes: recipe.readyInMinutes || 0,
                    servings: recipe.servings || 1,
                    healthScore: recipe.healthScore || 0,
                    summary: recipe.summary || '',
                    cuisines: recipe.cuisines || [],
                    dishTypes: recipe.dishTypes || [],
                    ingredients: recipe.ingredients || [],
                    instructions: recipe.instructions || [],
                    nutrition: recipe.nutrition || {
                        calories: 0,
                        protein: 0,
                        carbs: 0,
                        fat: 0
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }

                await setDoc(recipeDoc, recipeData, { merge: true })
                uploaded++

                if (uploaded % 10 === 0) {
                    console.log(`  Progress: ${uploaded}/${recipes.length} recipes uploaded`)
                }
            } catch (error) {
                console.error(`  ❌ Error uploading recipe ${recipe.id} (${recipe.title}):`, error.message)
                errors++

                // If permission denied, provide helpful message
                if (error.code === 'permission-denied' || error.message.includes('permission')) {
                    console.error('\n💡 Permission denied! You need to either:')
                    console.error('   1. Add FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD to .env')
                    console.error('   2. Temporarily update Firestore rules:')
                    console.error('      In firestore.rules, change:')
                    console.error('        allow write: if isAuthenticated();')
                    console.error('      To:')
                    console.error('        allow write: if true;')
                    console.error('   3. Deploy the updated rules, then run this script again')
                    console.error('   4. After upload, change the rule back for security!')
                    process.exit(1)
                }
            }
        }

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < recipes.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log('Upload Complete!')
    console.log('='.repeat(50))
    console.log(`✓ Uploaded: ${uploaded} recipes`)
    if (errors > 0) {
        console.log(`✗ Errors: ${errors} recipes`)
    }
    console.log(`\nTotal recipes in Firestore: ${uploaded}`)
    console.log('\n✅ Recipes are now available to all users and will load faster!')
}

uploadRecipes()
    .then(() => {
        console.log('\n✓ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n✗ Script failed:', error.message)
        process.exit(1)
    })
