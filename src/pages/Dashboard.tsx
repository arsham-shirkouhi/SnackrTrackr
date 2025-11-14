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
import { FoodLogEntry } from '../services/userTrackingService'
import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

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
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [selectedDateLog, setSelectedDateLog] = useState<DailyLog | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedDateMeals, setSelectedDateMeals] = useState<FoodLogEntry[]>([])
    const [editingMeal, setEditingMeal] = useState<string | null>(null)
    const [isAddingMeal, setIsAddingMeal] = useState(false)

    // Add meal modal states
    const [searchQuery, setSearchQuery] = useState('')
    const [searchMode, setSearchMode] = useState<'recipes' | 'manual'>('recipes')
    const [recipeResults, setRecipeResults] = useState<any[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)

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
            const dateStr = currentDate.toISOString().split('T')[0]
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
        setSelectedDate(currentDate.toISOString().split('T')[0])
    }

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0])
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
        fetchRecipeDetails(recipe.id)
    }

    const closeRecipePreview = () => {
        setShowRecipePreview(false)
        setSelectedRecipeDetails(null)
    }


    const addRecipeAsMeal = async (recipe: any) => {
        if (!user) return

        try {
            // Calculate nutrition per serving
            const caloriesPerServing = Math.round(recipe.nutrition.calories / recipe.servings)
            const proteinPerServing = Math.round(recipe.nutrition.protein / recipe.servings)
            const carbsPerServing = Math.round(recipe.nutrition.carbs / recipe.servings)
            const fatPerServing = Math.round(recipe.nutrition.fat / recipe.servings)

            const servingSize = `${recipe.title} (1 serving of ${recipe.servings})`

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
    const isToday = selectedDate === new Date().toISOString().split('T')[0]
    const weekDays = getWeekDays()

    const calorieProgress = userProfile && userProfile.goals.dailyCalories > 0
        ? (selectedDateLog?.calories || 0) / userProfile.goals.dailyCalories
        : 0
    const proteinProgress = userProfile && userProfile.goals.protein > 0
        ? (selectedDateLog?.protein || 0) / userProfile.goals.protein
        : 0
    const carbsProgress = userProfile && userProfile.goals.carbs > 0
        ? (selectedDateLog?.carbs || 0) / userProfile.goals.carbs
        : 0
    const fatProgress = userProfile && userProfile.goals.fat > 0
        ? (selectedDateLog?.fat || 0) / userProfile.goals.fat
        : 0

    const macroData = [
        { name: 'Protein', value: selectedDateLog?.protein || 0, color: '#3B82F6' },
        { name: 'Carbs', value: selectedDateLog?.carbs || 0, color: '#10B981' },
        { name: 'Fat', value: selectedDateLog?.fat || 0, color: '#F59E0B' },
    ]


    return (
        <div className="space-y-6">
            {/* Compact Calendar */}
            <div className="card py-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
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
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Previous week"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="flex-1 flex items-center gap-1 overflow-x-auto">
                        {weekDays.map((day) => {
                            const isSelected = day.dateStr === selectedDate
                            const isDayToday = day.dateStr === new Date().toISOString().split('T')[0]
                            return (
                                <button
                                    key={day.dateStr}
                                    onClick={() => setSelectedDate(day.dateStr)}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded-md min-w-[40px] transition-all ${isSelected
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : isDayToday
                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {day.dayName}
                                    </span>
                                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {day.dayNum}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                    <button
                        onClick={() => navigateWeek('next')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Next week"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Today's Meals - Show First */}
            <div id="meals-section" className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isToday ? "Today's Meals" : `Meals for ${selectedDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                    </h3>
                    <button
                        onClick={openAddMealModal}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Meal</span>
                    </button>
                </div>

                {/* Add Meal Form */}
                {(isAddingMeal || editingMeal) && (
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingMeal ? 'Edit Meal' : 'Add New Meal'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsAddingMeal(false)
                                    cancelEditing()
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
                                                {recipeResults.map((recipe: any) => {
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
                )}

                {/* Meals List */}
                <div className="space-y-4">
                    {selectedDateMeals.length === 0 ? (
                        <div className="card text-center py-12">
                            <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No meals logged for this day
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Start tracking your nutrition by adding your first meal
                            </p>
                            <button
                                onClick={openAddMealModal}
                                className="btn-primary"
                            >
                                Add Your First Meal
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDateMeals.map((meal) => (
                                <div key={meal.id} className="card">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${getMealTypeColor(meal.mealType)}`}>
                                                {getMealTypeIcon(meal.mealType)}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {meal.foodName}
                                                </h4>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center space-x-1">
                                                        <Flame className="w-3 h-3" />
                                                        <span>{meal.calories} cal</span>
                                                    </span>
                                                    <span>P: {meal.protein}g</span>
                                                    <span>C: {meal.carbs}g</span>
                                                    <span>F: {meal.fat}g</span>
                                                    {meal.timestamp && (
                                                        <span className="flex items-center space-x-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{meal.timestamp.toDate().toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}</span>
                                                        </span>
                                                    )}
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
            </div>

            {/* Macro Counter and Distribution - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Calorie and Macronutrient Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black dark:border-gray-700 p-6">
                    <div className="flex items-center gap-8">
                        {/* Left: Circular Calorie Progress */}
                        <div className="flex-shrink-0">
                            <div className="relative w-48 h-48">
                                <svg className="transform -rotate-90 w-48 h-48">
                                    {/* Background circle */}
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="70"
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="16"
                                        className="dark:stroke-gray-700"
                                    />
                                    {/* Progress circle - green */}
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="70"
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth="16"
                                        strokeDasharray={2 * Math.PI * 70}
                                        strokeDashoffset={2 * Math.PI * 70 * (1 - Math.min(calorieProgress, 1))}
                                        strokeLinecap="round"
                                        className="transition-all duration-300"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-black dark:text-white">
                                        {selectedDateLog?.calories || 0}
                                    </span>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                                        kcal consumed
                                    </span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-500 mt-0.5">
                                        {Math.max(0, Math.round((userProfile?.goals.dailyCalories || 2000) - (selectedDateLog?.calories || 0)))} left
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Macronutrient Progress Bars */}
                        <div className="flex-1 space-y-4">
                            {/* Protein */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-black dark:text-white lowercase">protein</span>
                                    <span className="text-xs font-bold text-black dark:text-white">
                                        {selectedDateLog?.protein || 0}g / {userProfile?.goals.protein || 150}g
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-white dark:bg-gray-700 rounded-full overflow-hidden border-2 border-black dark:border-gray-600">
                                    <div
                                        className="h-full bg-red-600 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(proteinProgress * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {Math.max(0, Math.round((userProfile?.goals.protein || 150) - (selectedDateLog?.protein || 0)))}g left
                                </div>
                            </div>

                            {/* Carbs */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-black dark:text-white lowercase">carbs</span>
                                    <span className="text-xs font-bold text-black dark:text-white">
                                        {selectedDateLog?.carbs || 0}g / {userProfile?.goals.carbs || 200}g
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-white dark:bg-gray-700 rounded-full overflow-hidden border-2 border-black dark:border-gray-600">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(carbsProgress * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {Math.max(0, Math.round((userProfile?.goals.carbs || 200) - (selectedDateLog?.carbs || 0)))}g left
                                </div>
                            </div>

                            {/* Fats */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-black dark:text-white lowercase">fats</span>
                                    <span className="text-xs font-bold text-black dark:text-white">
                                        {selectedDateLog?.fat || 0}g / {userProfile?.goals.fat || 65}g
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-white dark:bg-gray-700 rounded-full overflow-hidden border-2 border-black dark:border-gray-600">
                                    <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(fatProgress * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {Math.max(0, Math.round((userProfile?.goals.fat || 65) - (selectedDateLog?.fat || 0)))}g left
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Macro Distribution */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {isToday ? "Today's Macro Distribution" : 'Macro Distribution'}
                    </h3>
                    <div className="flex items-center gap-6">
                        {/* Left: Chart */}
                        <div className="flex-shrink-0" style={{ width: '200px', height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={macroData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {macroData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Right: Legend */}
                        <div className="flex-1 space-y-3">
                            {macroData.map((macro) => (
                                <div key={macro.name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: macro.color }}
                                        />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {macro.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {macro.value}g
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
