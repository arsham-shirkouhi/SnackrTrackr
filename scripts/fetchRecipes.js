import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
config({ path: path.join(__dirname, '..', '.env') })

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || process.env.VITE_SPOONACULAR_API_KEY

if (!SPOONACULAR_API_KEY) {
    console.error('Error: SPOONACULAR_API_KEY not found in environment variables')
    console.error('Please set SPOONACULAR_API_KEY or VITE_SPOONACULAR_API_KEY in your .env file')
    process.exit(1)
}

console.log('Using Spoonacular API Key:', SPOONACULAR_API_KEY.substring(0, 10) + '...')

const RECIPES_FILE = path.join(__dirname, '..', 'public', 'recipes.json')
const DATA_DIR = path.join(__dirname, '..', 'data')

// Create data directory if it doesn't exist
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true })
    } catch (error) {
        console.error('Error creating data directory:', error)
    }
}

// Popular search terms to get a diverse set of recipes
const SEARCH_TERMS = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'pasta', 'rice', 'bread',
    'salad', 'soup', 'pizza', 'burger', 'sandwich', 'tacos', 'curry',
    'stir fry', 'steak', 'shrimp', 'vegetables', 'dessert', 'cake', 'cookies',
    'breakfast', 'lunch', 'dinner', 'healthy', 'vegan', 'vegetarian',
    'italian', 'mexican', 'asian', 'mediterranean', 'indian', 'chinese',
    'japanese', 'thai', 'french', 'american', 'grilled', 'baked', 'fried'
]

async function fetchRecipeDetails(recipeId) {
    try {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`
        )

        if (!response.ok) {
            if (response.status === 402) {
                console.warn(`API quota exceeded for recipe ${recipeId}`)
                return null
            }
            console.warn(`Failed to fetch recipe ${recipeId}: ${response.status}`)
            return null
        }

        const data = await response.json()

        // Get nutrition data
        const nutritionResponse = await fetch(
            `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${SPOONACULAR_API_KEY}`
        )

        let nutrition = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        }

        if (nutritionResponse.ok) {
            const nutritionData = await nutritionResponse.json()
            nutrition = {
                calories: parseInt(nutritionData.calories?.replace(/\D/g, '') || '0'),
                protein: parseFloat(nutritionData.protein?.replace(/[^\d.]/g, '') || '0'),
                carbs: parseFloat(nutritionData.carbs?.replace(/[^\d.]/g, '') || '0'),
                fat: parseFloat(nutritionData.fat?.replace(/[^\d.]/g, '') || '0')
            }
        }

        return {
            id: data.id,
            title: data.title,
            image: data.image,
            readyInMinutes: data.readyInMinutes || 0,
            servings: data.servings || 1,
            healthScore: data.healthScore || 0,
            summary: data.summary || '',
            cuisines: data.cuisines || [],
            dishTypes: data.dishTypes || [],
            ingredients: data.extendedIngredients?.map((ing) => ({
                id: ing.id,
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                image: ing.image,
                original: ing.original
            })) || [],
            instructions: data.analyzedInstructions?.[0]?.steps?.map((step) => ({
                number: step.number,
                step: step.step
            })) || [],
            nutrition: data.nutrition ? {
                calories: data.nutrition.nutrients?.find((n) => n.name === 'Calories')?.amount || nutrition.calories,
                protein: data.nutrition.nutrients?.find((n) => n.name === 'Protein')?.amount || nutrition.protein,
                carbs: data.nutrition.nutrients?.find((n) => n.name === 'Carbohydrates')?.amount || nutrition.carbs,
                fat: data.nutrition.nutrients?.find((n) => n.name === 'Fat')?.amount || nutrition.fat
            } : nutrition
        }
    } catch (error) {
        console.error(`Error fetching recipe ${recipeId}:`, error.message)
        return null
    }
}

async function fetchRecipes() {
    console.log('Starting recipe fetch...')
    const allRecipes = new Map() // Use Map to avoid duplicates

    // Fetch recipes for each search term
    for (const searchTerm of SEARCH_TERMS) {
        console.log(`\nSearching for: ${searchTerm}`)

        try {
            // Search for recipes
            const searchResponse = await fetch(
                `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(searchTerm)}&number=50&apiKey=${SPOONACULAR_API_KEY}`
            )

            if (!searchResponse.ok) {
                if (searchResponse.status === 402) {
                    console.warn(`API quota exceeded. Stopping fetch.`)
                    break
                }
                console.warn(`Failed to search for ${searchTerm}: ${searchResponse.status}`)
                continue
            }

            const searchData = await searchResponse.json()

            if (!searchData.results || searchData.results.length === 0) {
                console.log(`No results for: ${searchTerm}`)
                continue
            }

            console.log(`Found ${searchData.results.length} recipes for "${searchTerm}"`)

            // Fetch details for each recipe (with rate limiting)
            for (let i = 0; i < searchData.results.length; i++) {
                const recipe = searchData.results[i]

                // Skip if we already have this recipe
                if (allRecipes.has(recipe.id)) {
                    console.log(`  Recipe ${recipe.id} already exists, skipping`)
                    continue
                }

                console.log(`  Fetching details for: ${recipe.title} (${i + 1}/${searchData.results.length})`)

                const recipeDetails = await fetchRecipeDetails(recipe.id)

                if (recipeDetails) {
                    allRecipes.set(recipe.id, recipeDetails)
                    console.log(`  ✓ Saved: ${recipeDetails.title}`)
                }

                // Rate limiting - wait 0.5 seconds between requests to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            // Wait 1 second between search terms
            await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
            console.error(`Error searching for ${searchTerm}:`, error.message)
            continue
        }
    }

    // Convert Map to Array
    const recipesArray = Array.from(allRecipes.values())

    console.log(`\n\nTotal unique recipes fetched: ${recipesArray.length}`)

    // Save to JSON file in both public (for web access) and data (for backup)
    try {
        await ensureDataDir()

        // Save to public folder (accessible from web)
        await fs.mkdir(path.dirname(RECIPES_FILE), { recursive: true })
        await fs.writeFile(RECIPES_FILE, JSON.stringify(recipesArray, null, 2), 'utf-8')
        console.log(`\n✓ Recipes saved to: ${RECIPES_FILE}`)

        // Also save to data folder as backup
        const backupFile = path.join(DATA_DIR, 'recipes.json')
        await fs.writeFile(backupFile, JSON.stringify(recipesArray, null, 2), 'utf-8')
        console.log(`✓ Backup saved to: ${backupFile}`)

        const fileStats = await fs.stat(RECIPES_FILE)
        console.log(`File size: ${(fileStats.size / 1024).toFixed(2)} KB`)
        console.log(`Total recipes: ${recipesArray.length}`)
    } catch (error) {
        console.error('Error saving recipes file:', error)
        process.exit(1)
    }
}

// Run the script
fetchRecipes().catch(console.error)

