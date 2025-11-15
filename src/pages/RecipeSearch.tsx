import React, { useState, useEffect, useRef } from 'react'
import {
    Search,
    Filter,
    Clock,
    Users,
    BookOpen,
    Flame,
    Target,
    Zap,
    Apple,
    Eye,
    List,
    ChevronRight,
    X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Recipe {
    id: number
    title: string
    image: string
    readyInMinutes: number
    servings: number
    healthScore: number
    cuisines: string[]
    dishTypes: string[]
    nutrition: {
        calories: number
        protein: number
        carbs: number
        fat: number
    }
}

interface RecipeDetails {
    id: number
    title: string
    image: string
    readyInMinutes: number
    servings: number
    healthScore: number
    summary: string
    cuisines: string[]
    dishTypes: string[]
    ingredients: Array<{
        id: number
        name: string
        amount: number
        unit: string
        image: string
        original: string
    }>
    instructions: Array<{
        number: number
        step: string
    }>
    nutrition: {
        calories: number
        protein: number
        carbs: number
        fat: number
    }
}

export const RecipeSearch: React.FC = () => {
    const { user, logFoodItem } = useAuth()
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [totalResults, setTotalResults] = useState(0)
    const [selectedFilters, setSelectedFilters] = useState({
        cuisine: '',
        diet: '',
        mealType: '',
        maxReadyTime: '',
        healthScore: ''
    })
    const [showFilters, setShowFilters] = useState(false)

    // Recipe details modal states
    const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<RecipeDetails | null>(null)
    const [showRecipePreview, setShowRecipePreview] = useState(false)
    const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false)
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')

    const recipesPerPage = 9
    const [error, setError] = useState<string | null>(null)
    const THEMEALDB_API_KEY = '1' // Free test key from TheMealDB
    const [apiSource, setApiSource] = useState<'themealdb' | 'spoonacular'>('themealdb')

    // Helper function to transform TheMealDB meal to our Recipe format
    // Works with both full meal data and filter endpoint data (basic info only)
    const transformTheMealDBMeal = (meal: any): Recipe => {
        // Check if this is basic data from filter endpoint (no ingredients/instructions)
        const isBasicData = !meal.strInstructions

        // Extract ingredients and measures (only if available)
        const ingredients: Array<{ name: string; amount: string }> = []
        if (!isBasicData) {
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`]
                const measure = meal[`strMeasure${i}`]
                if (ingredient && ingredient.trim()) {
                    ingredients.push({
                        name: ingredient,
                        amount: measure || ''
                    })
                }
            }
        }

        // Parse instructions into steps (only if available)
        const instructions = !isBasicData && meal.strInstructions
            ? meal.strInstructions.split('\n').filter((step: string) => step.trim())
            : []

        // Estimate servings (TheMealDB doesn't provide this, default to 4)
        const estimatedServings = 4

        // TheMealDB doesn't provide nutrition info, so we'll set defaults
        // Users can manually edit nutrition when adding to meal log
        return {
            id: parseInt(meal.idMeal) || 0,
            title: meal.strMeal || 'Unknown Recipe',
            image: meal.strMealThumb || '',
            readyInMinutes: 30, // Default since TheMealDB doesn't provide this
            servings: estimatedServings,
            healthScore: 7, // Default health score
            cuisines: meal.strArea ? [meal.strArea] : [],
            dishTypes: meal.strCategory ? [meal.strCategory] : [],
            nutrition: {
                calories: 0, // Will need manual entry
                protein: 0,
                carbs: 0,
                fat: 0
            },
            // Store additional TheMealDB data for details modal
            _themealdbData: {
                instructions,
                ingredients,
                area: meal.strArea || '',
                category: meal.strCategory || '',
                source: meal.strSource || '',
                youtube: meal.strYoutube || '',
                isBasicData // Flag to indicate if we need to fetch full details
            }
        } as any
    }

    // Load recipes from TheMealDB (primary API)
    const loadTheMealDBRecipes = async (query?: string, append: boolean = false) => {
        setLoading(true)
        setError(null)
        setApiSource('themealdb')

        try {
            let meals: any[] = []

            if (query && query.length >= 2) {
                // Search by name
                const searchResponse = await fetch(
                    `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/search.php?s=${encodeURIComponent(query)}`
                )
                const searchData = await searchResponse.json()
                meals = searchData.meals || []

                // Also try searching by category if we have few results (only when not appending)
                if (!append && meals.length < 10) {
                    const categories = ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Pasta', 'Dessert']
                    const matchingCategory = categories.find(cat =>
                        query.toLowerCase().includes(cat.toLowerCase()) ||
                        cat.toLowerCase().includes(query.toLowerCase())
                    )

                    if (matchingCategory) {
                        const categoryResponse = await fetch(
                            `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/filter.php?c=${encodeURIComponent(matchingCategory)}`
                        )
                        const categoryData = await categoryResponse.json()
                        if (categoryData.meals) {
                            // Get full details for first few
                            const limited = categoryData.meals.slice(0, 10)
                            const detailsPromises = limited.map((meal: any) =>
                                fetch(`https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/lookup.php?i=${meal.idMeal}`)
                                    .then(res => res.json())
                                    .then(data => data.meals?.[0])
                            )
                            const categoryMeals = await Promise.all(detailsPromises)
                            meals = [...meals, ...categoryMeals.filter(Boolean)]
                        }
                    }
                }
            } else {
                // Get meals from categories - use filter endpoint data directly (no individual lookups needed)
                // This avoids CORS and rate limiting issues by making only a few requests
                const categories = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegetarian', 'Breakfast']

                // Fetch 5 categories to get variety - each returns multiple meals with basic info
                const selectedCategories = categories.slice(0, 5)
                const categoryPromises = selectedCategories.map(category =>
                    fetch(`https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/filter.php?c=${encodeURIComponent(category)}`)
                        .then(res => res.json())
                        .then(data => (data.meals || []).map((meal: any) => ({
                            ...meal,
                            // Add category info to the meal object
                            strCategory: category,
                            // We'll fetch full details only when user clicks "View Details"
                            // For now, use basic info from filter endpoint
                            idMeal: meal.idMeal,
                            strMeal: meal.strMeal,
                            strMealThumb: meal.strMealThumb
                        })))
                        .catch(() => [])
                )

                const categoryResults = await Promise.all(categoryPromises)
                const allMeals = categoryResults.flat()

                // Remove duplicates and limit to 100
                const uniqueMeals = allMeals.reduce((acc: any[], meal: any) => {
                    if (!acc.find(m => m.idMeal === meal.idMeal)) {
                        acc.push(meal)
                    }
                    return acc
                }, [])
                meals = uniqueMeals.slice(0, 100)

                // Note: We're using basic info from filter endpoint
                // Full details (ingredients, instructions) will be fetched on-demand when user clicks "View Details"
            }

            if (meals.length === 0) {
                setError('No recipes found. Please try a different search term.')
                setRecipes([])
                setTotalResults(0)
                setLoading(false)
                return
            }

            const transformedRecipes = meals.map(transformTheMealDBMeal)

            if (!append) {
                setRecipes(transformedRecipes)
                setTotalResults(transformedRecipes.length)
            } else {
                // Append to existing recipes and remove duplicates
                setRecipes((prev) => {
                    const existingIds = new Set(prev.map(r => r.id))
                    const newRecipes = transformedRecipes.filter(r => !existingIds.has(r.id))
                    const updatedRecipes = [...prev, ...newRecipes]
                    // Update total results with the new count
                    setTotalResults(updatedRecipes.length)
                    return updatedRecipes
                })
            }
        } catch (error: any) {
            console.error('Error loading TheMealDB recipes:', error)
            setError('Failed to load recipes from TheMealDB. Please try again.')
            setRecipes([])
            setTotalResults(0)
        } finally {
            setLoading(false)
        }
    }

    // Get full recipe details from TheMealDB
    const fetchTheMealDBDetails = async (recipeId: number): Promise<RecipeDetails | null> => {
        try {
            const response = await fetch(
                `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/lookup.php?i=${recipeId}`
            )
            const data = await response.json()

            if (!data.meals || data.meals.length === 0) {
                return null
            }

            const meal = data.meals[0]
            const ingredients: Array<{
                id: number
                name: string
                amount: number
                unit: string
                image: string
                original: string
            }> = []

            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`]
                const measure = meal[`strMeasure${i}`]
                if (ingredient && ingredient.trim()) {
                    // Try to parse amount from measure
                    const measureMatch = measure?.match(/(\d+(?:\.\d+)?)/)
                    const amount = measureMatch ? parseFloat(measureMatch[1]) : 1

                    ingredients.push({
                        id: i,
                        name: ingredient,
                        amount: amount,
                        unit: measure || '',
                        image: `https://www.themealdb.com/images/ingredients/${ingredient}.png`,
                        original: `${measure || ''} ${ingredient}`.trim()
                    })
                }
            }

            const instructions = meal.strInstructions
                ? meal.strInstructions.split(/\r\n|\n/).filter((step: string) => step.trim()).map((step: string, index: number) => ({
                    number: index + 1,
                    step: step.trim()
                }))
                : []

            return {
                id: parseInt(meal.idMeal) || 0,
                title: meal.strMeal || 'Unknown Recipe',
                image: meal.strMealThumb || '',
                readyInMinutes: 30,
                servings: 4,
                healthScore: 7,
                summary: `${meal.strCategory || 'Recipe'} from ${meal.strArea || 'Various'} cuisine.${meal.strInstructions ? ' ' + meal.strInstructions.substring(0, 200) + '...' : ''}`,
                cuisines: meal.strArea ? [meal.strArea] : [],
                dishTypes: meal.strCategory ? [meal.strCategory] : [],
                ingredients,
                instructions,
                nutrition: {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0
                }
            }
        } catch (error) {
            console.error('Error fetching TheMealDB details:', error)
            return null
        }
    }

    // Load random recipes from Spoonacular (fallback only)
    const loadSpoonacularRecipes = async (query?: string, page: number = 0, append: boolean = false) => {
        const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY

        if (!SPOONACULAR_API_KEY) {
            throw new Error('Spoonacular API key not configured')
        }

        setApiSource('spoonacular')

        try {
            if (query && query.length >= 2) {
                // Build search parameters
                const searchParams = new URLSearchParams({
                    query: query,
                    number: recipesPerPage.toString(),
                    offset: (page * recipesPerPage).toString(),
                    addRecipeInformation: 'true',
                    apiKey: SPOONACULAR_API_KEY
                })

                const searchResponse = await fetch(
                    `https://api.spoonacular.com/recipes/complexSearch?${searchParams.toString()}`
                )

                if (!searchResponse.ok) {
                    throw new Error(`API responded with status ${searchResponse.status}`)
                }

                const searchData = await searchResponse.json()
                const searchRecipes = searchData.results || []

                // Fetch nutrition info for each recipe
                const recipesWithNutrition = await Promise.all(
                    searchRecipes.map(async (recipe: any) => {
                        try {
                            const nutritionResponse = await fetch(
                                `https://api.spoonacular.com/recipes/${recipe.id}/nutritionWidget.json?apiKey=${SPOONACULAR_API_KEY}`
                            )

                            if (!nutritionResponse.ok) {
                                return {
                                    id: recipe.id,
                                    title: recipe.title,
                                    image: recipe.image,
                                    readyInMinutes: recipe.readyInMinutes || 0,
                                    servings: recipe.servings || 1,
                                    healthScore: recipe.healthScore || 0,
                                    cuisines: recipe.cuisines || [],
                                    dishTypes: recipe.dishTypes || [],
                                    nutrition: {
                                        calories: 0,
                                        protein: 0,
                                        carbs: 0,
                                        fat: 0
                                    }
                                }
                            }

                            const nutritionData = await nutritionResponse.json()

                            return {
                                id: recipe.id,
                                title: recipe.title,
                                image: recipe.image,
                                readyInMinutes: recipe.readyInMinutes || 0,
                                servings: recipe.servings || 1,
                                healthScore: recipe.healthScore || 0,
                                cuisines: recipe.cuisines || [],
                                dishTypes: recipe.dishTypes || [],
                                nutrition: {
                                    calories: parseInt(nutritionData.calories?.replace(/\D/g, '') || '0'),
                                    protein: parseFloat(nutritionData.protein?.replace(/[^\d.]/g, '') || '0'),
                                    carbs: parseFloat(nutritionData.carbs?.replace(/[^\d.]/g, '') || '0'),
                                    fat: parseFloat(nutritionData.fat?.replace(/[^\d.]/g, '') || '0')
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching nutrition for recipe ${recipe.id}:`, error)
                            return {
                                id: recipe.id,
                                title: recipe.title,
                                image: recipe.image,
                                readyInMinutes: recipe.readyInMinutes || 0,
                                servings: recipe.servings || 1,
                                healthScore: recipe.healthScore || 0,
                                cuisines: recipe.cuisines || [],
                                dishTypes: recipe.dishTypes || [],
                                nutrition: {
                                    calories: 0,
                                    protein: 0,
                                    carbs: 0,
                                    fat: 0
                                }
                            }
                        }
                    })
                )

                if (append) {
                    setRecipes((prev) => [...prev, ...recipesWithNutrition])
                    setTotalResults((prev) => prev + recipesWithNutrition.length)
                } else {
                    setRecipes(recipesWithNutrition)
                    setTotalResults(searchData.totalResults || recipesWithNutrition.length)
                }
            } else {
                // Random/initial load with Spoonacular
                const searchResponse = await fetch(
                    `https://api.spoonacular.com/recipes/complexSearch?query=healthy&number=100&addRecipeInformation=true&apiKey=${SPOONACULAR_API_KEY}`
                )

                if (!searchResponse.ok) {
                    throw new Error(`API responded with status ${searchResponse.status}`)
                }

                const searchData = await searchResponse.json()
                const randomRecipes = searchData.results || []

                // Fetch nutrition info for each recipe
                const recipesWithNutrition = await Promise.all(
                    randomRecipes.map(async (recipe: any) => {
                        try {
                            const nutritionResponse = await fetch(
                                `https://api.spoonacular.com/recipes/${recipe.id}/nutritionWidget.json?apiKey=${SPOONACULAR_API_KEY}`
                            )

                            if (!nutritionResponse.ok) {
                                return {
                                    id: recipe.id,
                                    title: recipe.title,
                                    image: recipe.image,
                                    readyInMinutes: recipe.readyInMinutes || 0,
                                    servings: recipe.servings || 1,
                                    healthScore: recipe.healthScore || 0,
                                    cuisines: recipe.cuisines || [],
                                    dishTypes: recipe.dishTypes || [],
                                    nutrition: {
                                        calories: 0,
                                        protein: 0,
                                        carbs: 0,
                                        fat: 0
                                    }
                                }
                            }

                            const nutritionData = await nutritionResponse.json()

                            return {
                                id: recipe.id,
                                title: recipe.title,
                                image: recipe.image,
                                readyInMinutes: recipe.readyInMinutes || 0,
                                servings: recipe.servings || 1,
                                healthScore: recipe.healthScore || 0,
                                cuisines: recipe.cuisines || [],
                                dishTypes: recipe.dishTypes || [],
                                nutrition: {
                                    calories: parseInt(nutritionData.calories?.replace(/\D/g, '') || '0'),
                                    protein: parseFloat(nutritionData.protein?.replace(/[^\d.]/g, '') || '0'),
                                    carbs: parseFloat(nutritionData.carbs?.replace(/[^\d.]/g, '') || '0'),
                                    fat: parseFloat(nutritionData.fat?.replace(/[^\d.]/g, '') || '0')
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching nutrition for recipe ${recipe.id}:`, error)
                            return {
                                id: recipe.id,
                                title: recipe.title,
                                image: recipe.image,
                                readyInMinutes: recipe.readyInMinutes || 0,
                                servings: recipe.servings || 1,
                                healthScore: recipe.healthScore || 0,
                                cuisines: recipe.cuisines || [],
                                dishTypes: recipe.dishTypes || [],
                                nutrition: {
                                    calories: 0,
                                    protein: 0,
                                    carbs: 0,
                                    fat: 0
                                }
                            }
                        }
                    })
                )

                setRecipes(recipesWithNutrition)
                setTotalResults(recipesWithNutrition.length)
            }
            setLoading(false)
        } catch (error: any) {
            console.error('Error loading Spoonacular recipes:', error)
            throw error // Re-throw to let caller handle fallback
        }
    }

    // Load random recipes on component mount (Spoonacular primary, TheMealDB fallback)
    const loadRandomRecipes = async () => {
        setLoading(true)
        setError(null)

        try {
            // Try Spoonacular first (primary)
            await loadSpoonacularRecipes()
        } catch (error: any) {
            console.error('Error loading Spoonacular recipes, trying TheMealDB fallback:', error)
            // If Spoonacular fails, try TheMealDB as fallback
            try {
                await loadTheMealDBRecipes()
            } catch (mealDbError: any) {
                console.error('Both APIs failed:', mealDbError)
                setError('Failed to load recipes. Please try again later.')
                setLoading(false)
            }
        }
    }

    // Track if initial load has happened to prevent multiple loads
    const initialLoadRef = useRef(false)

    // Load random recipes on component mount - only once
    // DISABLED: Don't load recipes until user searches
    // useEffect(() => {
    //     // Prevent multiple loads (especially in React StrictMode)
    //     if (initialLoadRef.current) {
    //         return
    //     }

    //     initialLoadRef.current = true
    //     let mounted = true

    //     const loadInitial = async () => {
    //         if (mounted && initialLoadRef.current) {
    //             await loadRandomRecipes()
    //         }
    //     }

    //     loadInitial()

    //     return () => {
    //         mounted = false
    //     }
    // }, []) // Empty dependency array - only run once on mount

    // Search recipes (Spoonacular primary, TheMealDB fallback)
    const searchRecipes = async (page: number = 0, resetResults: boolean = true) => {
        if (!searchQuery || searchQuery.length < 2) {
            if (resetResults) {
                // If no query and resetting, load random recipes instead
                loadRandomRecipes()
            }
            return
        }

        setError(null)
        setLoading(true)

        try {
            // Try Spoonacular first (primary)
            await loadSpoonacularRecipes(searchQuery, page, !resetResults)
        } catch (error: any) {
            console.error('Error searching Spoonacular, trying TheMealDB fallback:', error)
            // If Spoonacular fails, try TheMealDB as fallback
            try {
                await loadTheMealDBRecipes(searchQuery, !resetResults)
            } catch (mealDbError: any) {
                console.error('Both APIs failed:', mealDbError)
                setError('Failed to search recipes. Please try again.')
                setLoading(false)
            }
        }
    }

    // Debounced search - only trigger when searchQuery actually changes
    useEffect(() => {
        // Skip if component just mounted and searchQuery is empty (initial load is handled separately)
        if (!searchQuery || searchQuery.length === 0) {
            return
        }

        const timeoutId = setTimeout(() => {
            if (searchQuery && searchQuery.length >= 2) {
                setCurrentPage(0)
                searchRecipes(0, true)
            }
        }, 800) // Increased debounce time to reduce requests

        return () => clearTimeout(timeoutId)
    }, [searchQuery]) // Only depends on searchQuery

    // Search when filters change - debounced to avoid excessive requests
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            return
        }

        const timeoutId = setTimeout(() => {
            setCurrentPage(0)
            searchRecipes(0, true)
        }, 800)

        return () => clearTimeout(timeoutId)
    }, [selectedFilters]) // Only trigger on filter changes, not on every render

    const fetchRecipeDetails = async (recipeId: number) => {
        setLoadingRecipeDetails(true)
        try {
            // Try Spoonacular first if we have API key
            const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY
            if (SPOONACULAR_API_KEY && apiSource === 'spoonacular') {
                try {
                    const response = await fetch(
                        `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`
                    )

                    if (response.ok) {
                        const data = await response.json()

                        // Format recipe details
                        const recipeDetails: RecipeDetails = {
                            id: data.id,
                            title: data.title,
                            image: data.image,
                            readyInMinutes: data.readyInMinutes,
                            servings: data.servings,
                            healthScore: data.healthScore,
                            summary: data.summary,
                            cuisines: data.cuisines || [],
                            dishTypes: data.dishTypes || [],
                            ingredients: data.extendedIngredients?.map((ing: any) => ({
                                id: ing.id,
                                name: ing.name,
                                amount: ing.amount,
                                unit: ing.unit,
                                image: ing.image,
                                original: ing.original
                            })) || [],
                            instructions: data.analyzedInstructions?.[0]?.steps?.map((step: any) => ({
                                number: step.number,
                                step: step.step
                            })) || [],
                            nutrition: data.nutrition ? {
                                calories: data.nutrition.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0,
                                protein: data.nutrition.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0,
                                carbs: data.nutrition.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0,
                                fat: data.nutrition.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0
                            } : {
                                calories: 0,
                                protein: 0,
                                carbs: 0,
                                fat: 0
                            }
                        }

                        setSelectedRecipeDetails(recipeDetails)
                        setShowRecipePreview(true)
                        setLoadingRecipeDetails(false)
                        return
                    }
                } catch (spoonError) {
                    console.error('Error fetching from Spoonacular, trying TheMealDB:', spoonError)
                }
            }

            // If Spoonacular doesn't work, try TheMealDB
            const details = await fetchTheMealDBDetails(recipeId)
            if (details) {
                setSelectedRecipeDetails(details)
                setShowRecipePreview(true)
                setLoadingRecipeDetails(false)
                return
            }

            throw new Error('Failed to fetch recipe details from both APIs')
        } catch (error) {
            console.error('Error fetching recipe details:', error)
            setError('Failed to load recipe details. Please try again.')
        } finally {
            setLoadingRecipeDetails(false)
        }
    }

    const openRecipePreview = (recipe: Recipe) => {
        fetchRecipeDetails(recipe.id)
    }

    const closeRecipePreview = () => {
        setShowRecipePreview(false)
        setSelectedRecipeDetails(null)
    }

    const addRecipeToMealLog = async (recipe: Recipe) => {
        if (!user) {
            alert('Please log in to add recipes to your meal log')
            return
        }

        try {
            // Calculate nutrition per serving
            // If using fallback API (TheMealDB), nutrition might be 0
            const caloriesPerServing = recipe.nutrition.calories > 0
                ? Math.round(recipe.nutrition.calories / recipe.servings)
                : 0
            const proteinPerServing = recipe.nutrition.protein > 0
                ? Math.round(recipe.nutrition.protein / recipe.servings)
                : 0
            const carbsPerServing = recipe.nutrition.carbs > 0
                ? Math.round(recipe.nutrition.carbs / recipe.servings)
                : 0
            const fatPerServing = recipe.nutrition.fat > 0
                ? Math.round(recipe.nutrition.fat / recipe.servings)
                : 0

            const servingSize = `${recipe.title} (1 serving of ${recipe.servings})`
            const today = new Date().toISOString().split('T')[0]

            if (apiSource === 'themealdb' && caloriesPerServing === 0) {
                const confirmAdd = confirm(
                    'This recipe doesn\'t include nutrition information. ' +
                    'It will be added with 0 calories/macros. You can edit the nutrition values later in your meal log. Continue?'
                )
                if (!confirmAdd) return
            }

            await logFoodItem(
                recipe.title,
                caloriesPerServing,
                proteinPerServing,
                carbsPerServing,
                fatPerServing,
                servingSize,
                selectedMealType,
                today
            )

            alert('Recipe added to your meal log!' + (apiSource === 'themealdb' && caloriesPerServing === 0 ? ' Remember to edit the nutrition values.' : ''))
        } catch (error) {
            console.error('Error adding recipe to meal log:', error)
            alert('Failed to add recipe. Please try again.')
        }
    }

    const loadMoreRecipes = async () => {
        setLoading(true)

        if (apiSource === 'spoonacular') {
            // For Spoonacular, use pagination
            const nextPage = currentPage + 1
            setCurrentPage(nextPage)
            try {
                await loadSpoonacularRecipes(searchQuery || undefined, nextPage, true)
            } catch (error: any) {
                console.error('Error loading more from Spoonacular, trying TheMealDB:', error)
                // Fallback to TheMealDB
                try {
                    const categories = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Miscellaneous', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian', 'Breakfast', 'Goat']
                    const remainingCategories = categories.slice(5) // Categories not used in initial load (first 5 were used)

                    if (remainingCategories.length > 0) {
                        const selectedCategories = remainingCategories.slice(0, 5)
                        const categoryPromises = selectedCategories.map(category =>
                            fetch(`https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/filter.php?c=${encodeURIComponent(category)}`)
                                .then(res => res.json())
                                .then(data => (data.meals || []).map((meal: any) => ({
                                    ...meal,
                                    strCategory: category,
                                    idMeal: meal.idMeal,
                                    strMeal: meal.strMeal,
                                    strMealThumb: meal.strMealThumb
                                })))
                                .catch(() => [])
                        )

                        const categoryResults = await Promise.all(categoryPromises)
                        const newMeals = categoryResults.flat().slice(0, 100)

                        // Remove duplicates
                        const transformedRecipes = newMeals.map(transformTheMealDBMeal).filter(Boolean)
                        setRecipes((prev) => {
                            const existingIds = new Set(prev.map(r => r.id))
                            const uniqueNew = transformedRecipes.filter(r => !existingIds.has(r.id))
                            return [...prev, ...uniqueNew]
                        })
                        setTotalResults((prev) => {
                            const existingIds = new Set(recipes.map(r => r.id))
                            const uniqueNew = transformedRecipes.filter(r => !existingIds.has(r.id))
                            return prev + uniqueNew.length
                        })
                    } else {
                        setError('No more recipes available to load.')
                    }
                } catch (mealDbError: any) {
                    setError('Failed to load more recipes. Please try again.')
                }
            }
        } else {
            // For TheMealDB, load more recipes from additional categories
            // Use filter endpoint directly (no individual lookups to avoid rate limits)
            try {
                const categories = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Miscellaneous', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian', 'Breakfast', 'Goat']
                const remainingCategories = categories.slice(5) // Categories not used in initial load (first 5 were used)

                if (remainingCategories.length > 0) {
                    const selectedCategories = remainingCategories.slice(0, 5)
                    const categoryPromises = selectedCategories.map(category =>
                        fetch(`https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/filter.php?c=${encodeURIComponent(category)}`)
                            .then(res => res.json())
                            .then(data => (data.meals || []).map((meal: any) => ({
                                ...meal,
                                strCategory: category,
                                idMeal: meal.idMeal,
                                strMeal: meal.strMeal,
                                strMealThumb: meal.strMealThumb
                            })))
                            .catch(() => [])
                    )

                    const categoryResults = await Promise.all(categoryPromises)
                    const newMeals = categoryResults.flat().slice(0, 100)

                    // Remove duplicates
                    const transformedRecipes = newMeals.map(transformTheMealDBMeal).filter(Boolean)
                    setRecipes((prev) => {
                        const existingIds = new Set(prev.map(r => r.id))
                        const uniqueNew = transformedRecipes.filter(r => !existingIds.has(r.id))
                        return [...prev, ...uniqueNew]
                    })
                    setTotalResults((prev) => {
                        const existingIds = new Set(recipes.map(r => r.id))
                        const uniqueNew = transformedRecipes.filter(r => !existingIds.has(r.id))
                        return prev + uniqueNew.length
                    })
                } else {
                    setError('No more recipes available to load.')
                }
            } catch (error: any) {
                console.error('Error loading more from TheMealDB:', error)
                setError('Failed to load more recipes. Please try again.')
            }
        }
        setLoading(false)
    }

    const handleManualSearch = () => {
        if (searchQuery && searchQuery.length >= 2) {
            setCurrentPage(0)
            searchRecipes(0, true)
        }
    }

    const getHealthScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
        if (score >= 6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    }

    const getCuisineColor = (cuisine: string) => {
        const colors: { [key: string]: string } = {
            'Mediterranean': 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            'Asian': 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
            'Italian': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
            'Mexican': 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
            'Indian': 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
            'American': 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
            'French': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        }
        return colors[cuisine] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }

    const hasMore = recipes.length < totalResults

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Recipe Search
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Discover healthy recipes tailored to your nutrition goals
                </p>
            </div>

            {/* Search and Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-primary-100 dark:bg-primary-900/20' : ''}`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>
                        <button
                            onClick={handleManualSearch}
                            disabled={loading || !searchQuery || searchQuery.length < 2}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Search className="w-4 h-4" />
                            <span>{loading ? 'Searching...' : 'Search'}</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Cuisine
                                </label>
                                <select
                                    value={selectedFilters.cuisine}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, cuisine: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Cuisine</option>
                                    <option value="African">African</option>
                                    <option value="American">American</option>
                                    <option value="British">British</option>
                                    <option value="Cajun">Cajun</option>
                                    <option value="Caribbean">Caribbean</option>
                                    <option value="Chinese">Chinese</option>
                                    <option value="Eastern European">Eastern European</option>
                                    <option value="European">European</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Greek">Greek</option>
                                    <option value="Indian">Indian</option>
                                    <option value="Irish">Irish</option>
                                    <option value="Italian">Italian</option>
                                    <option value="Japanese">Japanese</option>
                                    <option value="Jewish">Jewish</option>
                                    <option value="Korean">Korean</option>
                                    <option value="Latin American">Latin American</option>
                                    <option value="Mediterranean">Mediterranean</option>
                                    <option value="Mexican">Mexican</option>
                                    <option value="Middle Eastern">Middle Eastern</option>
                                    <option value="Nordic">Nordic</option>
                                    <option value="Southern">Southern</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="Thai">Thai</option>
                                    <option value="Vietnamese">Vietnamese</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Diet
                                </label>
                                <select
                                    value={selectedFilters.diet}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, diet: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Diet</option>
                                    <option value="gluten free">Gluten Free</option>
                                    <option value="ketogenic">Ketogenic</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="lacto-vegetarian">Lacto-Vegetarian</option>
                                    <option value="ovo-vegetarian">Ovo-Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="pescetarian">Pescetarian</option>
                                    <option value="paleo">Paleo</option>
                                    <option value="primal">Primal</option>
                                    <option value="low FODMAP">Low FODMAP</option>
                                    <option value="whole30">Whole30</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Meal Type
                                </label>
                                <select
                                    value={selectedFilters.mealType}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, mealType: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Meal</option>
                                    <option value="main course">Main Course</option>
                                    <option value="side dish">Side Dish</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="appetizer">Appetizer</option>
                                    <option value="salad">Salad</option>
                                    <option value="bread">Bread</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="soup">Soup</option>
                                    <option value="beverage">Beverage</option>
                                    <option value="sauce">Sauce</option>
                                    <option value="marinade">Marinade</option>
                                    <option value="fingerfood">Finger Food</option>
                                    <option value="snack">Snack</option>
                                    <option value="drink">Drink</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Max Ready Time (min)
                                </label>
                                <select
                                    value={selectedFilters.maxReadyTime}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, maxReadyTime: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Time</option>
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="90">1.5 hours</option>
                                    <option value="120">2 hours</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Min Health Score
                                </label>
                                <select
                                    value={selectedFilters.healthScore}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, healthScore: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Score</option>
                                    <option value="8">8+ (Very Healthy)</option>
                                    <option value="6">6+ (Healthy)</option>
                                    <option value="4">4+ (Moderate)</option>
                                    <option value="2">2+ (Fair)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* API Source Notice */}
            {apiSource === 'themealdb' && (
                <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-600 dark:text-yellow-400">
                        <strong>Note:</strong> Using TheMealDB as fallback API. Spoonacular is currently unavailable. Some recipes may not include nutrition info.
                    </p>
                </div>
            )}

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {loading && recipes.length === 0 ? 'Loading recipes...' : loading ? 'Loading more...' : totalResults > 0 ? `Found ${totalResults} recipes` : searchQuery && searchQuery.length >= 2 ? 'No recipes found' : recipes.length > 0 ? `Showing ${recipes.length} recipes` : 'Search for recipes to get started'}
                    </h2>
                    {totalResults > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {recipes.length} of {totalResults}
                        </div>
                    )}
                </div>

                {loading && recipes.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : recipes.length === 0 && !searchQuery ? (
                    <div className="card text-center py-12">
                        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Ready to discover amazing recipes?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Start by typing in the search box above to find recipes that match your taste and nutrition goals.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map((recipe) => {
                                const caloriesPerServing = Math.round(recipe.nutrition.calories / recipe.servings)
                                const proteinPerServing = Math.round(recipe.nutrition.protein / recipe.servings)
                                const carbsPerServing = Math.round(recipe.nutrition.carbs / recipe.servings)
                                const fatPerServing = Math.round(recipe.nutrition.fat / recipe.servings)

                                return (
                                    <div key={recipe.id} className="card hover:shadow-lg transition-shadow duration-200">
                                        <div className="relative">
                                            <img
                                                src={recipe.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                                                alt={recipe.title}
                                                className="w-full h-48 object-cover rounded-lg mb-4"
                                            />
                                            <div className="absolute top-2 left-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreColor(recipe.healthScore)}`}>
                                                    Health: {recipe.healthScore}/100
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                                                {recipe.title}
                                            </h3>

                                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{recipe.readyInMinutes} min</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{recipe.servings} servings</span>
                                                </div>
                                            </div>

                                            {recipe.cuisines && recipe.cuisines.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {recipe.cuisines.map((cuisine) => (
                                                        <span
                                                            key={cuisine}
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCuisineColor(cuisine)}`}
                                                        >
                                                            {cuisine}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                                    <Flame className="w-4 h-4 text-red-600 dark:text-red-400 mx-auto mb-1" />
                                                    <p className="text-xs font-medium text-red-600 dark:text-red-400">{caloriesPerServing}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">cal</p>
                                                </div>
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{proteinPerServing}g</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">protein</p>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                                                    <Zap className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                                                    <p className="text-xs font-medium text-green-600 dark:text-green-400">{carbsPerServing}g</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">carbs</p>
                                                </div>
                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
                                                    <Apple className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                                                    <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{fatPerServing}g</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">fat</p>
                                                </div>
                                            </div>

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => openRecipePreview(recipe)}
                                                    className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>View Details</span>
                                                </button>
                                                {user && (
                                                    <button
                                                        onClick={() => addRecipeToMealLog(recipe)}
                                                        className="btn-primary flex items-center space-x-2"
                                                    >
                                                        <BookOpen className="w-4 h-4" />
                                                        <span>Add</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Load More Button */}
                        {hasMore && !loading && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={loadMoreRecipes}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    <span>Load More Recipes</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {loading && recipes.length > 0 && (
                            <div className="flex justify-center mt-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Recipe Preview Modal */}
            {showRecipePreview && selectedRecipeDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recipe Details</h2>
                            <button
                                onClick={closeRecipePreview}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {loadingRecipeDetails ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Recipe Header */}
                                    <div className="flex gap-6 mb-6">
                                        {selectedRecipeDetails.image && (
                                            <img
                                                src={selectedRecipeDetails.image}
                                                alt={selectedRecipeDetails.title}
                                                className="w-48 h-48 object-cover rounded-lg flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                                {selectedRecipeDetails.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {selectedRecipeDetails.readyInMinutes} minutes
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {selectedRecipeDetails.servings} servings
                                                </span>
                                                {selectedRecipeDetails.healthScore > 0 && (
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getHealthScoreColor(selectedRecipeDetails.healthScore)}`}>
                                                        Health Score: {selectedRecipeDetails.healthScore}/100
                                                    </span>
                                                )}
                                            </div>
                                            {selectedRecipeDetails.summary && (
                                                <div
                                                    className="text-sm text-gray-600 dark:text-gray-400"
                                                    dangerouslySetInnerHTML={{ __html: selectedRecipeDetails.summary }}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Ingredients */}
                                    {selectedRecipeDetails.ingredients && selectedRecipeDetails.ingredients.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <List className="w-5 h-5" />
                                                Ingredients
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedRecipeDetails.ingredients.map((ingredient, index) => (
                                                    <div
                                                        key={ingredient.id || index}
                                                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                    >
                                                        {ingredient.image && (
                                                            <img
                                                                src={`https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}`}
                                                                alt={ingredient.name}
                                                                className="w-12 h-12 object-cover rounded"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {ingredient.original || `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Instructions */}
                                    {selectedRecipeDetails.instructions && selectedRecipeDetails.instructions.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                                Instructions
                                            </h4>
                                            <ol className="space-y-3">
                                                {selectedRecipeDetails.instructions.map((step, index) => (
                                                    <li key={index} className="flex gap-3">
                                                        <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                                            {step.number || index + 1}
                                                        </span>
                                                        <p className="text-gray-700 dark:text-gray-300 flex-1 pt-0.5">
                                                            {step.step}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    {/* Nutrition Info */}
                                    {selectedRecipeDetails.nutrition && (
                                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                                Nutrition (per serving)
                                            </h4>
                                            <div className="grid grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {Math.round(selectedRecipeDetails.nutrition.calories)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Protein</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {Math.round(selectedRecipeDetails.nutrition.protein)}g
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Carbs</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {Math.round(selectedRecipeDetails.nutrition.carbs)}g
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Fat</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {Math.round(selectedRecipeDetails.nutrition.fat)}g
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {user && (
                                        <div className="flex space-x-3">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Meal Type
                                                </label>
                                                <select
                                                    value={selectedMealType}
                                                    onChange={(e) => setSelectedMealType(e.target.value as any)}
                                                    className="input-field"
                                                >
                                                    <option value="breakfast">Breakfast</option>
                                                    <option value="lunch">Lunch</option>
                                                    <option value="dinner">Dinner</option>
                                                    <option value="snack">Snack</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const recipe = recipes.find((r) => r.id === selectedRecipeDetails.id)
                                                    if (recipe) {
                                                        addRecipeToMealLog(recipe)
                                                        closeRecipePreview()
                                                    }
                                                }}
                                                className="btn-primary flex items-center space-x-2"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                <span>Add to Meal Log</span>
                                            </button>
                                            <button
                                                onClick={closeRecipePreview}
                                                className="btn-secondary"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
