import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    Flame,
    ChevronLeft,
    ChevronRight,
    Utensils,
    Edit3,
    Trash2,
    Clock,
    Save,
    X,
    Plus,
    Search,
    Eye,
    List,
    Users,
    Apple,
    Zap
} from 'lucide-react'
import { FoodLogEntry, userTrackingService } from '../services/userTrackingService'
import { Heart } from 'lucide-react'
import { getLocalDateString, getTodayDateString } from '../utils/dateUtils'

interface DailyLog {
    date: string
    calories: number
    protein: number
    carbs: number
    fat: number
    meals: number
}


export const Dashboard: React.FC = () => {
    const { user, userProfile, getFoodLogsByDate, logFoodItem, deleteFoodLogEntry } = useAuth()
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString())
    const [selectedDateLog, setSelectedDateLog] = useState<DailyLog | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedDateMeals, setSelectedDateMeals] = useState<FoodLogEntry[]>([])
    const [weekCalories, setWeekCalories] = useState<{ [date: string]: number }>({})
    const [editingMeal, setEditingMeal] = useState<string | null>(null)
    const [isAddingMeal, setIsAddingMeal] = useState(false)

    // Add meal modal states
    const [searchQuery, setSearchQuery] = useState('')
    const [searchMode, setSearchMode] = useState<'recipes' | 'manual' | 'favorites'>('recipes')
    const [recipeResults, setRecipeResults] = useState<any[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([])
    const [favoritesLoading, setFavoritesLoading] = useState(false)

    // Recipe preview modal states
    const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<any>(null)
    const [showRecipePreview, setShowRecipePreview] = useState(false)
    const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false)

    // Edit meal form states
    const [mealName, setMealName] = useState('')
    const [mealCalories, setMealCalories] = useState('')
    const [mealProtein, setMealProtein] = useState('')
    const [mealCarbs, setMealCarbs] = useState('')
    const [mealFat, setMealFat] = useState('')
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')


    // Search recipes using Spoonacular API directly
    useEffect(() => {
        const searchRecipes = async () => {
            if (!searchQuery || searchQuery.length < 2 || searchMode !== 'recipes' || (!isAddingMeal && !editingMeal)) {
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

                if (!searchResponse.ok) {
                    throw new Error(`API responded with status ${searchResponse.status}`)
                }

                const searchData = await searchResponse.json()

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
                setSearchError('Failed to search recipes. Please try again.')
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
    }, [searchQuery, searchMode, selectedMealType, isAddingMeal])

    // Load favorites when favorites tab is selected
    useEffect(() => {
        const loadFavorites = async () => {
            if (searchMode === 'favorites' && (isAddingMeal || editingMeal) && user) {
                setFavoritesLoading(true)
                try {
                    const favorites = await userTrackingService.getFavoriteRecipes(user.uid)
                    // Convert favorites to recipe format for display
                    const formattedFavorites = favorites.map(fav => ({
                        id: fav.id,
                        title: fav.title,
                        description: fav.description,
                        readyInMinutes: fav.prepTime + fav.cookTime,
                        servings: fav.servings,
                        nutrition: {
                            calories: fav.calories,
                            protein: fav.protein,
                            carbs: fav.carbs,
                            fat: fav.fat
                        },
                        ingredients: fav.ingredients,
                        instructions: fav.instructions,
                        tags: fav.tags,
                        tips: fav.tips,
                        difficulty: fav.difficulty,
                        isFavorite: true
                    }))
                    setFavoriteRecipes(formattedFavorites)
                } catch (error) {
                    console.error('Error loading favorites:', error)
                    setSearchError('Failed to load favorites. Please try again.')
                } finally {
                    setFavoritesLoading(false)
                }
            } else if (searchMode !== 'favorites') {
                setFavoriteRecipes([])
            }
        }
        loadFavorites()
    }, [searchMode, isAddingMeal, editingMeal, user])

    // Fetch data for selected date
    useEffect(() => {
        const fetchSelectedDateData = async () => {
            if (!user) {
                setLoading(false)
                return
            }

            try {
                // Get selected date's food logs
                const dateFoodLogs = await getFoodLogsByDate(selectedDate)

                // Calculate totals from food logs
                const dateData = {
                    caloriesConsumed: dateFoodLogs.reduce((sum, log) => sum + log.calories, 0),
                    proteinConsumed: dateFoodLogs.reduce((sum, log) => sum + log.protein, 0),
                    carbsConsumed: dateFoodLogs.reduce((sum, log) => sum + log.carbs, 0),
                    fatConsumed: dateFoodLogs.reduce((sum, log) => sum + log.fat, 0),
                    mealsLogged: dateFoodLogs.filter(log => log.mealType !== 'snack').length,
                    snacksLogged: dateFoodLogs.filter(log => log.mealType === 'snack').length
                }

                // Create selected date's log
                const dateLogData: DailyLog = {
                    date: selectedDate,
                    calories: dateData.caloriesConsumed || 0,
                    protein: dateData.proteinConsumed || 0,
                    carbs: dateData.carbsConsumed || 0,
                    fat: dateData.fatConsumed || 0,
                    meals: dateData.mealsLogged || 0
                }
                setSelectedDateLog(dateLogData)
                setSelectedDateMeals(dateFoodLogs.sort((a, b) => {
                    // Sort by timestamp if available
                    if (a.timestamp && b.timestamp) {
                        return a.timestamp.toMillis() - b.timestamp.toMillis()
                    }
                    return 0
                }))
                setLoading(false)
            } catch (error) {
                console.error('Error fetching selected date data:', error)
                setLoading(false)
            }
        }

        fetchSelectedDateData()
    }, [user, selectedDate, getFoodLogsByDate])

    // Fetch calories for all days in the current week
    useEffect(() => {
        const fetchWeekCalories = async () => {
            if (!user) return

            try {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const startDate = new Date(today)
                startDate.setDate(today.getDate() - 2)

                const caloriesMap: { [date: string]: number } = {}

                for (let i = 0; i < 7; i++) {
                    const currentDate = new Date(startDate)
                    currentDate.setDate(startDate.getDate() + i)
                    const dateStr = getLocalDateString(currentDate)
                    const dateFoodLogs = await getFoodLogsByDate(dateStr)
                    const totalCalories = dateFoodLogs.reduce((sum, log) => sum + log.calories, 0)
                    caloriesMap[dateStr] = totalCalories
                }

                setWeekCalories(caloriesMap)
            } catch (error) {
                console.error('Error fetching week calories:', error)
            }
        }

        fetchWeekCalories()
    }, [user, selectedDate, getFoodLogsByDate, selectedDateMeals])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    // Calendar navigation functions
    const getWeekDays = () => {
        const days: { date: Date; dateStr: string; dayName: string; dayNum: number }[] = []
        // Show 7 days (1 week) starting from today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Start 2 days before today to show context
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 2)

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate)
            currentDate.setDate(startDate.getDate() + i)
            const dateStr = getLocalDateString(currentDate)
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            const dayIndex = currentDate.getDay()
            days.push({
                date: currentDate,
                dateStr,
                dayName: daysOfWeek[dayIndex],
                dayNum: currentDate.getDate()
            })
        }
        return days
    }

    const navigateWeek = (direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedDate)
        const daysToAdd = direction === 'next' ? 7 : -7
        currentDate.setDate(currentDate.getDate() + daysToAdd)
        setSelectedDate(getLocalDateString(currentDate))
    }

    const goToToday = () => {
        setSelectedDate(getTodayDateString())
    }

    // Meal editing functions
    const startEditing = (meal: FoodLogEntry) => {
        setEditingMeal(meal.id)
        setMealName(meal.foodName)
        setMealCalories(meal.calories.toString())
        setMealProtein(meal.protein.toString())
        setMealCarbs(meal.carbs.toString())
        setMealFat(meal.fat.toString())
        setSelectedMealType(meal.mealType)
    }

    const cancelEditing = () => {
        setEditingMeal(null)
        setMealName('')
        setMealCalories('')
        setMealProtein('')
        setMealCarbs('')
        setMealFat('')
        setSelectedMealType('breakfast')
    }

    const resetAddMealForm = () => {
        setSearchQuery('')
        setRecipeResults([])
        setSearchError(null)
        setMealName('')
        setMealCalories('')
        setMealProtein('')
        setMealCarbs('')
        setMealFat('')
        setSelectedMealType('breakfast')
        setSearchMode('recipes')
    }

    const openAddMealModal = () => {
        setIsAddingMeal(true)
        resetAddMealForm()
    }

    // Helper function to extract recipeId from servingSize
    const getRecipeIdFromServingSize = (servingSize: string): number | null => {
        if (servingSize.startsWith('RECIPE_ID:')) {
            const match = servingSize.match(/^RECIPE_ID:(\d+)\|/)
            return match ? parseInt(match[1], 10) : null
        }
        return null
    }

    // Helper function to get display serving size (without recipeId)
    const getDisplayServingSize = (servingSize: string): string => {
        if (servingSize.startsWith('RECIPE_ID:')) {
            const parts = servingSize.split('|')
            return parts.length > 1 ? parts.slice(1).join('|') : servingSize
        }
        return servingSize
    }

    // Handle meal title click to show recipe details
    const handleMealTitleClick = async (e: React.MouseEvent, meal: FoodLogEntry) => {
        e.preventDefault()
        e.stopPropagation()
        const recipeId = getRecipeIdFromServingSize(meal.servingSize)
        if (recipeId) {
            setShowRecipePreview(true)
            setLoadingRecipeDetails(true)
            await fetchRecipeDetails(recipeId)
        }
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

    const openRecipePreview = (recipe: any) => {
        // If it's a favorite recipe (has ingredients/instructions), show it directly
        if (recipe.ingredients && recipe.instructions) {
            const recipeDetails = {
                id: recipe.id,
                title: recipe.title,
                description: recipe.description,
                readyInMinutes: recipe.readyInMinutes,
                servings: recipe.servings,
                ingredients: recipe.ingredients.map((ing: any) => ({
                    name: ing.name,
                    amount: ing.amount,
                    unit: ing.unit,
                    original: `${ing.amount} ${ing.unit} ${ing.name}`
                })),
                instructions: recipe.instructions.map((inst: string, index: number) => ({
                    number: index + 1,
                    step: inst
                })),
                nutrition: recipe.nutrition,
                tags: recipe.tags,
                tips: recipe.tips
            }
            setSelectedRecipeDetails(recipeDetails)
            setShowRecipePreview(true)
        } else {
            // Regular Spoonacular recipe
            fetchRecipeDetails(recipe.id)
        }
    }

    const closeRecipePreview = () => {
        setShowRecipePreview(false)
        setSelectedRecipeDetails(null)
    }


    const addRecipeAsMeal = async (recipe: any) => {
        if (!user) return

        try {
            // Check if this is a favorite recipe (already has per-serving values)
            // vs Spoonacular recipe (has total nutrition that needs to be divided)
            const isFavoriteRecipe = recipe.isFavorite === true

            let caloriesPerServing: number
            let proteinPerServing: number
            let carbsPerServing: number
            let fatPerServing: number

            if (isFavoriteRecipe) {
                // Favorite recipes already have per-serving values, use them directly
                caloriesPerServing = Math.round(recipe.nutrition.calories)
                proteinPerServing = Math.round(recipe.nutrition.protein)
                carbsPerServing = Math.round(recipe.nutrition.carbs)
                fatPerServing = Math.round(recipe.nutrition.fat)
            } else {
                // Spoonacular recipes have total nutrition, divide by servings
                caloriesPerServing = Math.round(recipe.nutrition.calories / recipe.servings)
                proteinPerServing = Math.round(recipe.nutrition.protein / recipe.servings)
                carbsPerServing = Math.round(recipe.nutrition.carbs / recipe.servings)
                fatPerServing = Math.round(recipe.nutrition.fat / recipe.servings)
            }

            // Store recipeId in servingSize for later retrieval: "RECIPE_ID:123|actual serving size"
            const servingSize = `RECIPE_ID:${recipe.id}|${recipe.title} (1 serving of ${recipe.servings})`

            await logFoodItem(
                recipe.title,
                caloriesPerServing,
                proteinPerServing,
                carbsPerServing,
                fatPerServing,
                servingSize,
                selectedMealType,
                selectedDate
            )

            // Refresh meals list
            const dateFoodLogs = await getFoodLogsByDate(selectedDate)
            setSelectedDateMeals(dateFoodLogs.sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return a.timestamp.toMillis() - b.timestamp.toMillis()
                }
                return 0
            }))

            // Update log
            const dateData = {
                caloriesConsumed: dateFoodLogs.reduce((sum, log) => sum + log.calories, 0),
                proteinConsumed: dateFoodLogs.reduce((sum, log) => sum + log.protein, 0),
                carbsConsumed: dateFoodLogs.reduce((sum, log) => sum + log.carbs, 0),
                fatConsumed: dateFoodLogs.reduce((sum, log) => sum + log.fat, 0),
                mealsLogged: dateFoodLogs.filter(log => log.mealType !== 'snack').length
            }
            setSelectedDateLog({
                date: selectedDate,
                calories: dateData.caloriesConsumed || 0,
                protein: dateData.proteinConsumed || 0,
                carbs: dateData.carbsConsumed || 0,
                fat: dateData.fatConsumed || 0,
                meals: dateData.mealsLogged || 0
            })

            setIsAddingMeal(false)
            resetAddMealForm()
        } catch (error) {
            console.error('Error adding recipe as meal:', error)
            alert('Failed to add recipe. Please try again.')
        }
    }

    const addMealManually = async () => {
        if (!user || !mealName || !mealCalories) {
            alert('Please fill in meal name and calories at minimum.')
            return
        }

        try {
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
                selectedMealType,
                selectedDate
            )

            // Refresh meals list
            const dateFoodLogs = await getFoodLogsByDate(selectedDate)
            setSelectedDateMeals(dateFoodLogs.sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return a.timestamp.toMillis() - b.timestamp.toMillis()
                }
                return 0
            }))

            // Update log
            const dateData = {
                caloriesConsumed: dateFoodLogs.reduce((sum, log) => sum + log.calories, 0),
                proteinConsumed: dateFoodLogs.reduce((sum, log) => sum + log.protein, 0),
                carbsConsumed: dateFoodLogs.reduce((sum, log) => sum + log.carbs, 0),
                fatConsumed: dateFoodLogs.reduce((sum, log) => sum + log.fat, 0),
                mealsLogged: dateFoodLogs.filter(log => log.mealType !== 'snack').length
            }
            setSelectedDateLog({
                date: selectedDate,
                calories: dateData.caloriesConsumed || 0,
                protein: dateData.proteinConsumed || 0,
                carbs: dateData.carbsConsumed || 0,
                fat: dateData.fatConsumed || 0,
                meals: dateData.mealsLogged || 0
            })

            setIsAddingMeal(false)
            resetAddMealForm()
        } catch (error) {
            console.error('Error adding meal:', error)
            alert('Failed to add meal. Please try again.')
        }
    }

    const updateMeal = async () => {
        if (!user || !editingMeal || !mealName || !mealCalories) return

        try {
            // Delete old meal and add new one
            await deleteFoodLogEntry(editingMeal)

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
                selectedMealType,
                selectedDate // Pass the selected date
            )

            // Refresh meals list
            const dateFoodLogs = await getFoodLogsByDate(selectedDate)
            setSelectedDateMeals(dateFoodLogs.sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return a.timestamp.toMillis() - b.timestamp.toMillis()
                }
                return 0
            }))

            // Update log
            const dateData = {
                caloriesConsumed: dateFoodLogs.reduce((sum, log) => sum + log.calories, 0),
                proteinConsumed: dateFoodLogs.reduce((sum, log) => sum + log.protein, 0),
                carbsConsumed: dateFoodLogs.reduce((sum, log) => sum + log.carbs, 0),
                fatConsumed: dateFoodLogs.reduce((sum, log) => sum + log.fat, 0),
                mealsLogged: dateFoodLogs.filter(log => log.mealType !== 'snack').length
            }
            setSelectedDateLog({
                date: selectedDate,
                calories: dateData.caloriesConsumed || 0,
                protein: dateData.proteinConsumed || 0,
                carbs: dateData.carbsConsumed || 0,
                fat: dateData.fatConsumed || 0,
                meals: dateData.mealsLogged || 0
            })

            cancelEditing()
        } catch (error) {
            console.error('Error updating meal:', error)
            alert('Failed to update meal. Please try again.')
        }
    }

    const deleteMeal = async (mealId: string) => {
        if (!user) return
        if (!confirm('Are you sure you want to delete this meal?')) return

        try {
            await deleteFoodLogEntry(mealId)

            // Refresh meals list
            const dateFoodLogs = await getFoodLogsByDate(selectedDate)
            setSelectedDateMeals(dateFoodLogs.sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return a.timestamp.toMillis() - b.timestamp.toMillis()
                }
                return 0
            }))

            // Update log
            const dateData = {
                caloriesConsumed: dateFoodLogs.reduce((sum, log) => sum + log.calories, 0),
                proteinConsumed: dateFoodLogs.reduce((sum, log) => sum + log.protein, 0),
                carbsConsumed: dateFoodLogs.reduce((sum, log) => sum + log.carbs, 0),
                fatConsumed: dateFoodLogs.reduce((sum, log) => sum + log.fat, 0),
                mealsLogged: dateFoodLogs.filter(log => log.mealType !== 'snack').length
            }
            setSelectedDateLog({
                date: selectedDate,
                calories: dateData.caloriesConsumed || 0,
                protein: dateData.proteinConsumed || 0,
                carbs: dateData.carbsConsumed || 0,
                fat: dateData.fatConsumed || 0,
                meals: dateData.mealsLogged || 0
            })
        } catch (error) {
            console.error('Error deleting meal:', error)
            alert('Failed to delete meal. Please try again.')
        }
    }

    const getMealTypeIcon = (mealType: string) => {
        switch (mealType) {
            case 'breakfast':
                return <Apple className="w-4 h-4" />
            case 'lunch':
                return <Utensils className="w-4 h-4" />
            case 'dinner':
                return <Utensils className="w-4 h-4" />
            case 'snack':
                return <Zap className="w-4 h-4" />
            default:
                return <Utensils className="w-4 h-4" />
        }
    }

    const getMealTypeColor = (mealType: string) => {
        switch (mealType) {
            case 'breakfast':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
            case 'lunch':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            case 'dinner':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
            case 'snack':
                return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            default:
                return 'bg-gray-100 dark:bg-gray-700'
        }
    }

    const selectedDateObj = new Date(selectedDate)
    const isToday = selectedDate === getTodayDateString()
    const weekDays = getWeekDays()


    return (
        <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track your daily nutrition and meals
                    </p>
                </div>
                <button
                    onClick={openAddMealModal}
                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Meal</span>
                </button>
            </div>

            {/* Calendar and Macro Cards Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slideUp">
                {/* Left: Daily Summary - Macro Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/50">
                        <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                            <span className="text-sm text-blue-600 dark:text-blue-400">Calories</span>
                            <span>
                                <span className="text-blue-600 dark:text-blue-400">{selectedDateLog?.calories || 0}</span>
                                <span className="text-blue-600 dark:text-blue-400"> / {Math.round(userProfile?.goals?.dailyCalories || 0)}</span>
                            </span>
                        </p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/50">
                        <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                            <span className="text-sm text-red-600 dark:text-red-400">Protein</span>
                            <span>
                                <span className="text-red-600 dark:text-red-400">{Math.round(selectedDateLog?.protein || 0)}g</span>
                                <span className="text-red-600 dark:text-red-400"> / {Math.round(userProfile?.goals?.protein || 0)}g</span>
                            </span>
                        </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-200 dark:hover:shadow-green-900/50">
                        <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                            <span className="text-sm text-green-600 dark:text-green-400">Carbs</span>
                            <span>
                                <span className="text-green-600 dark:text-green-400">{Math.round(selectedDateLog?.carbs || 0)}g</span>
                                <span className="text-green-600 dark:text-green-400"> / {Math.round(userProfile?.goals?.carbs || 0)}g</span>
                            </span>
                        </p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-200 dark:hover:shadow-yellow-900/50">
                        <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">Fat</span>
                            <span>
                                <span className="text-yellow-600 dark:text-yellow-400">{Math.round(selectedDateLog?.fat || 0)}g</span>
                                <span className="text-yellow-600 dark:text-yellow-400"> / {Math.round(userProfile?.goals?.fat || 0)}g</span>
                            </span>
                        </p>
                    </div>
                </div>

                {/* Right: Calendar */}
                <div className="card px-3 py-2.5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {isToday ? "Today" : selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h3>
                        {!isToday && (
                            <button
                                onClick={goToToday}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                            >
                                Today
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => navigateWeek('prev')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200 flex-shrink-0 hover:scale-110 active:scale-95"
                            aria-label="Previous week"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="flex-1 flex items-center gap-[15px] overflow-x-auto">
                            {weekDays.map((day) => {
                                const isSelected = day.dateStr === selectedDate
                                const isDayToday = day.dateStr === getTodayDateString()
                                const dayCalories = weekCalories[day.dateStr] || 0
                                const dailyGoal = userProfile?.goals?.dailyCalories || 1
                                const fillPercentage = Math.min((dayCalories / dailyGoal) * 100, 100)
                                const dayLabel = day.dayName.charAt(0).toUpperCase()

                                return (
                                    <button
                                        key={day.dateStr}
                                        onClick={() => setSelectedDate(day.dateStr)}
                                        className="flex flex-col items-center gap-2 flex-1 transition-all duration-300"
                                    >
                                        <span className={`text-xs font-bold ${isSelected || isDayToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {dayLabel}
                                        </span>
                                        <div className={`relative w-full aspect-square rounded-lg border-2 overflow-hidden transition-all duration-300 ${isSelected
                                            ? 'border-primary-600 dark:border-primary-500 shadow-md'
                                            : isDayToday
                                                ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                            }`}>
                                            {/* Blue fill from bottom */}
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-blue-500 dark:bg-blue-600 transition-all duration-500"
                                                style={{ height: `${fillPercentage}%` }}
                                            ></div>
                                            {/* Date number overlay */}
                                            <div className={`absolute inset-0 flex items-center justify-center font-bold text-sm ${isSelected
                                                ? 'text-white'
                                                : fillPercentage > 50
                                                    ? 'text-white'
                                                    : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {day.dayNum}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            onClick={() => navigateWeek('next')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200 flex-shrink-0 hover:scale-110 active:scale-95"
                            aria-label="Next week"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Meals - Show First */}
            <div id="meals-section" className="space-y-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isToday ? "Today's Meals" : `Meals for ${selectedDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                </h3>

                {/* Meals List - Organized by Meal Type */}
                <div className="space-y-6">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType, index) => {
                        const mealsForType = selectedDateMeals.filter(meal => meal.mealType === mealType)

                        const mealTypeLabels = {
                            breakfast: 'Breakfast',
                            lunch: 'Lunch',
                            dinner: 'Dinner',
                            snack: 'Snacks'
                        }

                        return (
                            <div key={mealType}>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        {getMealTypeIcon(mealType)}
                                        <h4 className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                                            {mealTypeLabels[mealType]}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {mealsForType.length === 0 ? (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 italic pl-8">
                                                No meals logged
                                            </div>
                                        ) : (
                                            mealsForType.map((meal, mealIndex) => (
                                                <div
                                                    key={meal.id}
                                                    className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary-300 dark:hover:border-primary-600 animate-slideIn"
                                                    style={{ animationDelay: `${mealIndex * 0.1}s` }}
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <div className="relative flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h4
                                                                onClick={(e) => {
                                                                    const recipeId = getRecipeIdFromServingSize(meal.servingSize)
                                                                    if (recipeId) {
                                                                        handleMealTitleClick(e, meal)
                                                                    }
                                                                }}
                                                                className={`font-semibold text-lg mb-2 transition-colors ${getRecipeIdFromServingSize(meal.servingSize)
                                                                    ? 'text-blue-600 dark:text-blue-400 cursor-pointer hover:underline hover:text-blue-700 dark:hover:text-blue-300'
                                                                    : 'text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                                                    }`}
                                                            >
                                                                {meal.foodName}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                                <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                                                                    <Flame className="w-3.5 h-3.5" />
                                                                    <span>{meal.calories} cal</span>
                                                                </span>
                                                                <span className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-medium">P: {meal.protein}g</span>
                                                                <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium">C: {meal.carbs}g</span>
                                                                <span className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full font-medium">F: {meal.fat}g</span>
                                                                {meal.timestamp && (
                                                                    <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        <span>{meal.timestamp.toDate().toLocaleTimeString('en-US', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2 ml-4">
                                                            <button
                                                                onClick={() => startEditing(meal)}
                                                                className="p-2.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteMeal(meal.id)}
                                                                className="p-2.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {index < 3 && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 mt-6"></div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Add Meal Modal */}
            {(isAddingMeal || editingMeal) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        setIsAddingMeal(false)
                        cancelEditing()
                    }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingMeal ? 'Edit Meal' : 'Add New Meal'}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsAddingMeal(false)
                                    cancelEditing()
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
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

                            {/* Tabs */}
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => setSearchMode('recipes')}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${searchMode === 'recipes'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        Search Recipes
                                    </button>
                                    <button
                                        onClick={() => setSearchMode('favorites')}
                                        className={`px-4 py-2 text-sm font-medium transition-colors flex items-center space-x-1 ${searchMode === 'favorites'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Heart className="w-4 h-4" />
                                        <span>Favorites</span>
                                    </button>
                                    <button
                                        onClick={() => setSearchMode('manual')}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${searchMode === 'manual'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        Manual Entry
                                    </button>
                                </div>
                            </div>

                            {/* Search Recipes */}
                            {searchMode === 'recipes' && (
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
                                        <div className="mt-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-2 space-y-2">
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
                                                    {recipeResults.map((recipe: any) => {
                                                        const caloriesPerServing = Math.round(recipe.nutrition.calories)
                                                        const proteinPerServing = Math.round(recipe.nutrition.protein)
                                                        const carbsPerServing = Math.round(recipe.nutrition.carbs)
                                                        const fatPerServing = Math.round(recipe.nutrition.fat)

                                                        return (
                                                            <div
                                                                key={recipe.id}
                                                                className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm"
                                                            >
                                                                <div className="relative flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                                            {recipe.title}
                                                                        </h4>
                                                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                                                            <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                                                                                <Flame className="w-3.5 h-3.5" />
                                                                                <span>{caloriesPerServing} cal</span>
                                                                            </span>
                                                                            <span className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-medium">P: {proteinPerServing}g</span>
                                                                            <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium">C: {carbsPerServing}g</span>
                                                                            <span className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full font-medium">F: {fatPerServing}g</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2 ml-4">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                openRecipePreview(recipe)
                                                                            }}
                                                                            className="p-2.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
                                                                            title="View recipe details"
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => addRecipeAsMeal(recipe)}
                                                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                                                                        >
                                                                            Add
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
                            )}

                            {/* Favorites */}
                            {searchMode === 'favorites' && (
                                <div>
                                    <div className="mt-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-2 space-y-2">
                                        {favoritesLoading ? (
                                            <div className="p-4 text-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                    Loading favorites...
                                                </p>
                                            </div>
                                        ) : searchError ? (
                                            <div className="p-4 text-center">
                                                <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>
                                            </div>
                                        ) : favoriteRecipes.length === 0 ? (
                                            <div className="p-4 text-center">
                                                <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    No favorite recipes yet. Create and favorite recipes in the Recipe Creator!
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {favoriteRecipes.map((recipe: any) => {
                                                    const caloriesPerServing = Math.round(recipe.nutrition.calories)
                                                    const proteinPerServing = Math.round(recipe.nutrition.protein)
                                                    const carbsPerServing = Math.round(recipe.nutrition.carbs)
                                                    const fatPerServing = Math.round(recipe.nutrition.fat)

                                                    return (
                                                        <div
                                                            key={recipe.id}
                                                            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm"
                                                        >
                                                            <div className="relative flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                                                                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                                            {recipe.title}
                                                                        </h4>
                                                                    </div>
                                                                    {recipe.description && (
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                                                            {recipe.description}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                                                        <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                                                                            <Flame className="w-3.5 h-3.5" />
                                                                            <span>{caloriesPerServing} cal</span>
                                                                        </span>
                                                                        <span className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-medium">P: {proteinPerServing}g</span>
                                                                        <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium">C: {carbsPerServing}g</span>
                                                                        <span className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full font-medium">F: {fatPerServing}g</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2 ml-4">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            openRecipePreview(recipe)
                                                                        }}
                                                                        className="p-2.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
                                                                        title="View recipe details"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => addRecipeAsMeal(recipe)}
                                                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Manual Entry */}
                            {searchMode === 'manual' && (
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
                            )}

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => editingMeal ? updateMeal() : addMealManually()}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{editingMeal ? 'Update Meal' : 'Save Meal'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingMeal(false)
                                        cancelEditing()
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recipe Preview Modal */}
            {
                showRecipePreview && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={closeRecipePreview}
                    >
                        <div
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
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
                                ) : selectedRecipeDetails ? (
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
                                                    const recipe = recipeResults.find((r: any) => r.id === selectedRecipeDetails.id)
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
                                ) : (
                                    <div className="flex items-center justify-center py-12">
                                        <p className="text-gray-600 dark:text-gray-400">Failed to load recipe details.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
