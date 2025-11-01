import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    Plus,
    Search,
    Clock,
    Utensils,
    Trash2,
    Edit3,
    Save,
    X,
    Flame,
    Target,
    Zap,
    Apple,
    Users,
    Eye,
    List
} from 'lucide-react'

interface Meal {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    timestamp: Date
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

interface Recipe {
    id: string
    title: string
    image: string
    readyInMinutes: number
    servings: number
    healthScore: number
    cuisines: string[]
    dishTypes: string[]
    summary: string
    nutrition: {
        calories: number
        protein: number
        carbs: number
        fat: number
    }
}

export const MealLogger: React.FC = () => {
    const { user, getFoodLogsByDate, logFoodItem, deleteFoodLogEntry } = useAuth()
    const [meals, setMeals] = useState<Meal[]>([])
    const [isAddingMeal, setIsAddingMeal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const searchMode = 'recipes' as const
    const [selectedMealType, setSelectedMealType] = useState<Meal['mealType']>('breakfast')
    const [editingMeal, setEditingMeal] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [recipeResults, setRecipeResults] = useState<Recipe[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)

    // Recipe preview modal states
    const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<any>(null)
    const [showRecipePreview, setShowRecipePreview] = useState(false)
    const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false)

    // New meal form
    const [mealName, setMealName] = useState('')
    const [mealCalories, setMealCalories] = useState('')
    const [mealProtein, setMealProtein] = useState('')
    const [mealCarbs, setMealCarbs] = useState('')
    const [mealFat, setMealFat] = useState('')

    // Helper function to fetch meals
    const fetchMeals = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        try {
            const today = new Date().toISOString().split('T')[0]
            const foodLogs = await getFoodLogsByDate(today)

            // Convert FoodLogEntry to Meal format
            const mealsData: Meal[] = foodLogs.map(log => ({
                id: log.id,
                name: log.foodName,
                calories: log.calories,
                protein: log.protein,
                carbs: log.carbs,
                fat: log.fat,
                timestamp: log.timestamp.toDate(),
                mealType: log.mealType
            }))

            // Sort by timestamp (most recent first)
            mealsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

            setMeals(mealsData)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching meals:', error)
            setLoading(false)
        }
    }

    // Fetch meals from Firebase
    useEffect(() => {
        fetchMeals()
    }, [user, getFoodLogsByDate])


    // Search recipes using Spoonacular API directly
    useEffect(() => {
        const searchRecipes = async () => {
            if (!searchQuery || searchQuery.length < 2) {
                setRecipeResults([])
                return
            }

            const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY

            if (!SPOONACULAR_API_KEY) {
                setSearchError('Spoonacular API key not configured. Please add VITE_SPOONACULAR_API_KEY to your .env file')
                setRecipeResults([])
                return
            }

            setSearchLoading(true)
            setSearchError(null)

            try {
                // First, search for recipes
                const searchParams = new URLSearchParams({
                    query: searchQuery,
                    number: '20',
                    apiKey: SPOONACULAR_API_KEY
                })

                if (selectedMealType && selectedMealType !== 'snack') {
                    searchParams.append('type', selectedMealType)
                }

                const searchResponse = await fetch(
                    `https://api.spoonacular.com/recipes/complexSearch?${searchParams.toString()}`
                )

                // Parse the response first
                const searchData = await searchResponse.json()

                // Check for API errors (rate limit, invalid key, etc.)
                if (!searchResponse.ok || searchData.code === 402 || searchData.status === 'failure') {
                    console.error('Spoonacular API error:', searchData)

                    // Check for rate limit or quota errors
                    if (searchResponse.status === 402 || searchData.code === 402) {
                        throw new Error('API_RATE_LIMIT')
                    }

                    // Check for invalid API key
                    if (searchResponse.status === 401 || searchData.code === 401) {
                        throw new Error('API_INVALID_KEY')
                    }

                    throw new Error(searchData.message || `API responded with status ${searchResponse.status}`)
                }

                if (!searchData || !searchData.results || searchData.results.length === 0) {
                    setRecipeResults([])
                    setSearchLoading(false)
                    return
                }

                // Fetch nutrition info for each recipe
                const recipesWithNutrition = await Promise.all(
                    searchData.results.map(async (recipe: any) => {
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

                setRecipeResults(recipesWithNutrition)
            } catch (error: any) {
                console.error('Error searching recipes:', error)

                // Provide specific error messages
                if (error.message === 'API_RATE_LIMIT') {
                    setSearchError('API rate limit exceeded. You\'ve reached the maximum number of free API requests. Please try again tomorrow or upgrade your Spoonacular API plan.')
                } else if (error.message === 'API_INVALID_KEY') {
                    setSearchError('Invalid API key. Please check your Spoonacular API configuration.')
                } else if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                    setSearchError('Network error. Please check your internet connection.')
                } else {
                    setSearchError(error.message || 'Failed to search recipes. Please try again.')
                }

                setRecipeResults([])
            } finally {
                setSearchLoading(false)
            }
        }

        // Debounce search - wait 500ms after user stops typing
        const timeoutId = setTimeout(() => {
            searchRecipes()
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchQuery, searchMode, selectedMealType])

    const addMeal = async () => {
        if (!mealName || !mealCalories || !user) return

        try {
            const calories = parseFloat(mealCalories)
            const protein = parseFloat(mealProtein) || 0
            const carbs = parseFloat(mealCarbs) || 0
            const fat = parseFloat(mealFat) || 0
            const servingSize = `${mealName} - 1 serving`

            // Log food item to Firebase
            await logFoodItem(
                mealName,
                calories,
                protein,
                carbs,
                fat,
                servingSize,
                selectedMealType
            )

            // Refresh meals list from Firebase
            await fetchMeals()
            resetForm()
            setIsAddingMeal(false)
        } catch (error) {
            console.error('Error adding meal:', error)
            alert('Failed to add meal. Please try again.')
        }
    }


    const addRecipeAsMeal = async (recipe: Recipe) => {
        if (!user) return

        try {
            // The nutritionWidget.json API returns per-serving nutrition already, so we don't need to divide
            const caloriesPerServing = Math.round(recipe.nutrition.calories)
            const proteinPerServing = Math.round(recipe.nutrition.protein)
            const carbsPerServing = Math.round(recipe.nutrition.carbs)
            const fatPerServing = Math.round(recipe.nutrition.fat)

            const servingSize = `${recipe.title} (1 serving of ${recipe.servings})`

            // Log the recipe as a meal
            await logFoodItem(
                recipe.title,
                caloriesPerServing,
                proteinPerServing,
                carbsPerServing,
                fatPerServing,
                servingSize,
                selectedMealType
            )

            // Refresh meals list
            await fetchMeals()
            setSearchQuery('')
            setIsAddingMeal(false)
        } catch (error) {
            console.error('Error adding recipe as meal:', error)
            alert('Failed to add recipe. Please try again.')
        }
    }

    const deleteMeal = async (id: string) => {
        if (!user) return

        try {
            await deleteFoodLogEntry(id)
            // Refresh meals list from Firebase
            await fetchMeals()
        } catch (error) {
            console.error('Error deleting meal:', error)
            alert('Failed to delete meal. Please try again.')
        }
    }

    const updateMeal = async (id: string) => {
        if (!user || !mealName || !mealCalories) return

        try {
            // Delete old meal and add new one (Firestore doesn't have a direct update for food logs in this structure)
            await deleteFoodLogEntry(id)

            const calories = parseFloat(mealCalories)
            const protein = parseFloat(mealProtein) || 0
            const carbs = parseFloat(mealCarbs) || 0
            const fat = parseFloat(mealFat) || 0
            const servingSize = `${mealName} - 1 serving`

            await logFoodItem(
                mealName,
                calories,
                protein,
                carbs,
                fat,
                servingSize,
                selectedMealType
            )

            // Refresh meals list from Firebase
            await fetchMeals()
            setEditingMeal(null)
            resetForm()
        } catch (error) {
            console.error('Error updating meal:', error)
            alert('Failed to update meal. Please try again.')
        }
    }

    const startEditing = (meal: Meal) => {
        setEditingMeal(meal.id)
        setMealName(meal.name)
        setMealCalories(meal.calories.toString())
        setMealProtein(meal.protein.toString())
        setMealCarbs(meal.carbs.toString())
        setMealFat(meal.fat.toString())
        setSelectedMealType(meal.mealType)
    }

    const resetForm = () => {
        setMealName('')
        setMealCalories('')
        setMealProtein('')
        setMealCarbs('')
        setMealFat('')
        setSelectedMealType('breakfast')
        setEditingMeal(null)
    }

    const fetchRecipeDetails = async (recipeId: number) => {
        const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY

        if (!SPOONACULAR_API_KEY) {
            setSearchError('Spoonacular API key not configured')
            return
        }

        setLoadingRecipeDetails(true)
        try {
            const response = await fetch(
                `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch recipe details: ${response.status}`)
            }

            const data = await response.json()

            // Format recipe details
            const recipeDetails = {
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
                } : null
            }

            setSelectedRecipeDetails(recipeDetails)
            setShowRecipePreview(true)
        } catch (error) {
            console.error('Error fetching recipe details:', error)
            setSearchError('Failed to load recipe details. Please try again.')
        } finally {
            setLoadingRecipeDetails(false)
        }
    }

    const openRecipePreview = (recipe: Recipe) => {
        fetchRecipeDetails(Number(recipe.id))
    }

    const closeRecipePreview = () => {
        setShowRecipePreview(false)
        setSelectedRecipeDetails(null)
    }

    const getTotalCalories = () => {
        return meals.reduce((total, meal) => total + meal.calories, 0)
    }

    const getTotalProtein = () => {
        return meals.reduce((total, meal) => total + meal.protein, 0)
    }

    const getTotalCarbs = () => {
        return meals.reduce((total, meal) => total + meal.carbs, 0)
    }

    const getTotalFat = () => {
        return meals.reduce((total, meal) => total + meal.fat, 0)
    }

    const getMealTypeIcon = (mealType: Meal['mealType']) => {
        switch (mealType) {
            case 'breakfast': return <Apple className="w-4 h-4" />
            case 'lunch': return <Utensils className="w-4 h-4" />
            case 'dinner': return <Utensils className="w-4 h-4" />
            case 'snack': return <Zap className="w-4 h-4" />
        }
    }

    const getMealTypeColor = (mealType: Meal['mealType']) => {
        switch (mealType) {
            case 'breakfast': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
            case 'lunch': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            case 'dinner': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
            case 'snack': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Meal Logger
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track your daily meals and nutrition intake
                    </p>
                </div>
                <button
                    onClick={() => setIsAddingMeal(true)}
                    className="btn-primary flex items-center space-x-2 mt-4 md:mt-0"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Meal</span>
                </button>
            </div>

            {/* Daily Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <Flame className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {getTotalCalories()}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Protein</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {getTotalProtein().toFixed(1)}g
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Carbs</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {getTotalCarbs().toFixed(1)}g
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                            <Apple className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Fat</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {getTotalFat().toFixed(1)}g
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Meal Form */}
            {(isAddingMeal || editingMeal) && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Add New Meal
                        </h3>
                        <button
                            onClick={() => {
                                setIsAddingMeal(false)
                                resetForm()
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Meal Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Meal Type
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedMealType(type)}
                                        className={`p-3 rounded-lg border-2 transition-colors ${selectedMealType === type
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {getMealTypeIcon(type)}
                                            <span className="text-sm font-medium capitalize">{type}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Recipes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search Recipes
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search recipes by name (e.g., pasta, salad, chicken)..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setSearchError(null)
                                    }}
                                    className="input-field pl-10"
                                />
                            </div>
                            {searchQuery && (
                                <div className="mt-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                                    {searchLoading ? (
                                        <div className="p-4 text-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                Searching recipes...
                                            </p>
                                        </div>
                                    ) : searchError ? (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>
                                        </div>
                                    ) : recipeResults.length === 0 ? (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {searchQuery.length < 2
                                                    ? 'Type at least 2 characters to search'
                                                    : 'No recipes found. Try a different search term.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {recipeResults.map((recipe) => {
                                                // nutritionWidget.json already returns per-serving values
                                                const caloriesPerServing = Math.round(recipe.nutrition.calories)
                                                const proteinPerServing = Math.round(recipe.nutrition.protein)
                                                const carbsPerServing = Math.round(recipe.nutrition.carbs)
                                                const fatPerServing = Math.round(recipe.nutrition.fat)

                                                return (
                                                    <div
                                                        key={recipe.id}
                                                        className="w-full p-4 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                                    >
                                                        <div className="flex gap-4">
                                                            {recipe.image && (
                                                                <img
                                                                    src={recipe.image}
                                                                    alt={recipe.title}
                                                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                                                />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                                                            {recipe.title}
                                                                        </p>
                                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            <span className="flex items-center gap-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                {recipe.readyInMinutes} min
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Users className="w-3 h-3" />
                                                                                {recipe.servings} servings
                                                                            </span>
                                                                            {recipe.healthScore > 0 && (
                                                                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                                                                    Health: {recipe.healthScore}/10
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            openRecipePreview(recipe)
                                                                        }}
                                                                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                                                                        title="View recipe details"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                                                                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                                        <p className="text-xs font-medium text-red-600 dark:text-red-400">{caloriesPerServing}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">cal</p>
                                                                    </div>
                                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                                                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{proteinPerServing}g</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">prot</p>
                                                                    </div>
                                                                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                                                        <p className="text-xs font-medium text-green-600 dark:text-green-400">{carbsPerServing}g</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">carbs</p>
                                                                    </div>
                                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                                                                        <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{fatPerServing}g</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">fat</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => addRecipeAsMeal(recipe)}
                                                                    className="mt-3 w-full btn-primary text-sm py-2"
                                                                >
                                                                    Add to Log
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manual Entry */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Meal Name
                                </label>
                                <input
                                    type="text"
                                    value={mealName}
                                    onChange={(e) => setMealName(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g., Grilled Chicken Breast"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Calories
                                </label>
                                <input
                                    type="number"
                                    value={mealCalories}
                                    onChange={(e) => setMealCalories(e.target.value)}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Protein (g)
                                </label>
                                <input
                                    type="number"
                                    value={mealProtein}
                                    onChange={(e) => setMealProtein(e.target.value)}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Carbs (g)
                                </label>
                                <input
                                    type="number"
                                    value={mealCarbs}
                                    onChange={(e) => setMealCarbs(e.target.value)}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fat (g)
                                </label>
                                <input
                                    type="number"
                                    value={mealFat}
                                    onChange={(e) => setMealFat(e.target.value)}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => editingMeal ? updateMeal(editingMeal) : addMeal()}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>{editingMeal ? 'Update Meal' : 'Save Meal'}</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingMeal(false)
                                    resetForm()
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Meals List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Today's Meals
                </h3>
                {loading ? (
                    <div className="card text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading meals...</p>
                    </div>
                ) : meals.length === 0 ? (
                    <div className="card text-center py-12">
                        <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No meals logged yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Start tracking your nutrition by adding your first meal
                        </p>
                        <button
                            onClick={() => setIsAddingMeal(true)}
                            className="btn-primary"
                        >
                            Add Your First Meal
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {meals.map((meal) => (
                            <div key={meal.id} className="card">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-full ${getMealTypeColor(meal.mealType)}`}>
                                            {getMealTypeIcon(meal.mealType)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {meal.name}
                                            </h4>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center space-x-1">
                                                    <Flame className="w-3 h-3" />
                                                    <span>{meal.calories} cal</span>
                                                </span>
                                                <span>P: {meal.protein}g</span>
                                                <span>C: {meal.carbs}g</span>
                                                <span>F: {meal.fat}g</span>
                                                <span className="flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{meal.timestamp.toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => startEditing(meal)}
                                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteMeal(meal.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                                                        Health Score: {selectedRecipeDetails.healthScore}/10
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
                                                {selectedRecipeDetails.ingredients.map((ingredient: any, index: number) => (
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
                                                {selectedRecipeDetails.instructions.map((step: any, index: number) => (
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

                                    {/* Add Recipe Button */}
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                const recipe = recipeResults.find((r) => r.id === selectedRecipeDetails.id)
                                                if (recipe) {
                                                    addRecipeAsMeal(recipe)
                                                    closeRecipePreview()
                                                }
                                            }}
                                            className="btn-primary flex items-center space-x-2 flex-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add to Meal Log</span>
                                        </button>
                                        <button
                                            onClick={closeRecipePreview}
                                            className="btn-secondary"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
