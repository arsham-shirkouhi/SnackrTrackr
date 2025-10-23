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
    Apple
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

interface FoodItem {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    serving: string
}

export const MealLogger: React.FC = () => {
    const { userProfile } = useAuth()
    const [meals, setMeals] = useState<Meal[]>([])
    const [isAddingMeal, setIsAddingMeal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMealType, setSelectedMealType] = useState<Meal['mealType']>('breakfast')
    const [editingMeal, setEditingMeal] = useState<string | null>(null)

    // New meal form
    const [mealName, setMealName] = useState('')
    const [mealCalories, setMealCalories] = useState('')
    const [mealProtein, setMealProtein] = useState('')
    const [mealCarbs, setMealCarbs] = useState('')
    const [mealFat, setMealFat] = useState('')

    // Mock food database
    const foodDatabase: FoodItem[] = [
        { id: '1', name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
        { id: '2', name: 'Brown Rice (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 1.8, serving: '1 cup' },
        { id: '3', name: 'Avocado (1 medium)', calories: 234, protein: 3, carbs: 12, fat: 21, serving: '1 medium' },
        { id: '4', name: 'Greek Yogurt (1 cup)', calories: 100, protein: 17, carbs: 6, fat: 0, serving: '1 cup' },
        { id: '5', name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: '1 medium' },
        { id: '6', name: 'Eggs (2 large)', calories: 140, protein: 12, carbs: 1, fat: 10, serving: '2 large' },
        { id: '7', name: 'Salmon (100g)', calories: 208, protein: 25, carbs: 0, fat: 12, serving: '100g' },
        { id: '8', name: 'Sweet Potato (1 medium)', calories: 112, protein: 2, carbs: 26, fat: 0.1, serving: '1 medium' },
    ]

    // Mock meals data
    useEffect(() => {
        const mockMeals: Meal[] = [
            {
                id: '1',
                name: 'Greek Yogurt Bowl',
                calories: 320,
                protein: 25,
                carbs: 35,
                fat: 8,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                mealType: 'breakfast'
            },
            {
                id: '2',
                name: 'Chicken Salad',
                calories: 450,
                protein: 35,
                carbs: 15,
                fat: 25,
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                mealType: 'lunch'
            },
            {
                id: '3',
                name: 'Protein Shake',
                calories: 200,
                protein: 30,
                carbs: 10,
                fat: 2,
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                mealType: 'snack'
            }
        ]
        setMeals(mockMeals)
    }, [])

    const filteredFoods = foodDatabase.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const addMeal = () => {
        if (!mealName || !mealCalories) return

        const newMeal: Meal = {
            id: Date.now().toString(),
            name: mealName,
            calories: parseFloat(mealCalories),
            protein: parseFloat(mealProtein) || 0,
            carbs: parseFloat(mealCarbs) || 0,
            fat: parseFloat(mealFat) || 0,
            timestamp: new Date(),
            mealType: selectedMealType
        }

        setMeals([newMeal, ...meals])
        resetForm()
        setIsAddingMeal(false)
    }

    const addFoodItem = (food: FoodItem) => {
        setMealName(food.name)
        setMealCalories(food.calories.toString())
        setMealProtein(food.protein.toString())
        setMealCarbs(food.carbs.toString())
        setMealFat(food.fat.toString())
        setSearchQuery('')
    }

    const deleteMeal = (id: string) => {
        setMeals(meals.filter(meal => meal.id !== id))
    }

    const updateMeal = (id: string) => {
        const updatedMeals = meals.map(meal =>
            meal.id === id
                ? {
                    ...meal,
                    name: mealName,
                    calories: parseFloat(mealCalories),
                    protein: parseFloat(mealProtein) || 0,
                    carbs: parseFloat(mealCarbs) || 0,
                    fat: parseFloat(mealFat) || 0,
                }
                : meal
        )
        setMeals(updatedMeals)
        setEditingMeal(null)
        resetForm()
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
            {isAddingMeal && (
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

                        {/* Food Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search Foods
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for foods..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-10"
                                />
                            </div>
                            {searchQuery && (
                                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                                    {filteredFoods.map((food) => (
                                        <button
                                            key={food.id}
                                            onClick={() => addFoodItem(food)}
                                            className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{food.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{food.serving}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {food.calories} cal
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
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
                                onClick={addMeal}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Meal</span>
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
                {meals.length === 0 ? (
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
        </div>
    )
}
