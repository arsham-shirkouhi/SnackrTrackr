import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FoodLogEntry } from '../services/userTrackingService'

const FoodLoggingComponent: React.FC = () => {
    const {
        user,
        userPreferences,
        todayTrackingData,
        logFoodItem,
        getFoodLogsByDate,
        deleteFoodLogEntry,
        getFoodLogsByMealType,
        updateUserPreferences
    } = useAuth()

    const [foodName, setFoodName] = useState('')
    const [calories, setCalories] = useState(0)
    const [protein, setProtein] = useState(0)
    const [carbs, setCarbs] = useState(0)
    const [fat, setFat] = useState(0)
    const [servingSize, setServingSize] = useState('')
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([])
    const [loading, setLoading] = useState(false)

    // Load food logs when date changes
    useEffect(() => {
        if (user) {
            loadFoodLogs()
        }
    }, [selectedDate, user])

    const loadFoodLogs = async () => {
        if (!user) return

        try {
            setLoading(true)
            const logs = await getFoodLogsByDate(selectedDate)
            setFoodLogs(logs)
        } catch (error) {
            console.error('Error loading food logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogFood = async () => {
        if (!foodName.trim() || calories <= 0) {
            alert('Please enter food name and calories')
            return
        }

        try {
            await logFoodItem(foodName, calories, protein, carbs, fat, servingSize, mealType)

            // Clear form
            setFoodName('')
            setCalories(0)
            setProtein(0)
            setCarbs(0)
            setFat(0)
            setServingSize('')

            // Reload food logs
            await loadFoodLogs()

            alert('Food logged successfully!')
        } catch (error) {
            console.error('Error logging food:', error)
            alert('Error logging food')
        }
    }

    const handleDeleteFood = async (foodLogId: string) => {
        if (!confirm('Are you sure you want to delete this food entry?')) return

        try {
            await deleteFoodLogEntry(foodLogId)
            await loadFoodLogs()
            alert('Food entry deleted successfully!')
        } catch (error) {
            console.error('Error deleting food entry:', error)
            alert('Error deleting food entry')
        }
    }

    const formatTime = (timestamp: any) => {
        if (!timestamp) return ''
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const getMealTypeColor = (type: string) => {
        switch (type) {
            case 'breakfast': return 'bg-yellow-100 text-yellow-800'
            case 'lunch': return 'bg-blue-100 text-blue-800'
            case 'dinner': return 'bg-purple-100 text-purple-800'
            case 'snack': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (!user) {
        return <div className="p-4 text-center">Please log in to use food logging features</div>
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-center mb-8">Food Logging System</h1>

            {/* Today's Summary */}
            {todayTrackingData && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Today's Nutrition Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{todayTrackingData.caloriesConsumed}</div>
                            <div className="text-sm text-gray-600">Calories</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{todayTrackingData.proteinConsumed}g</div>
                            <div className="text-sm text-gray-600">Protein</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{todayTrackingData.carbsConsumed}g</div>
                            <div className="text-sm text-gray-600">Carbs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{todayTrackingData.fatConsumed}g</div>
                            <div className="text-sm text-gray-600">Fat</div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Preferences */}
            {userPreferences && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Meal Preferences</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-600">{userPreferences.preferredMealTimes.breakfast}</div>
                            <div className="text-sm text-gray-600">Breakfast</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">{userPreferences.preferredMealTimes.lunch}</div>
                            <div className="text-sm text-gray-600">Lunch</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">{userPreferences.preferredMealTimes.dinner}</div>
                            <div className="text-sm text-gray-600">Dinner</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Food Logging Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Log Food Item</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                            <input
                                type="text"
                                value={foodName}
                                onChange={(e) => setFoodName(e.target.value)}
                                placeholder="e.g., Grilled Chicken Breast"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                                <input
                                    type="number"
                                    value={calories}
                                    onChange={(e) => setCalories(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                                <input
                                    type="text"
                                    value={servingSize}
                                    onChange={(e) => setServingSize(e.target.value)}
                                    placeholder="e.g., 100g, 1 cup"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={protein}
                                    onChange={(e) => setProtein(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={carbs}
                                    onChange={(e) => setCarbs(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={fat}
                                    onChange={(e) => setFat(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                            <select
                                value={mealType}
                                onChange={(e) => setMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                            </select>
                        </div>

                        <button
                            onClick={handleLogFood}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Log Food Item
                        </button>
                    </div>
                </div>

                {/* Food Logs Display */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Food Logs</h3>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : foodLogs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No food logged for {selectedDate}
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {foodLogs.map((log) => (
                                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{log.foodName}</h4>
                                            <p className="text-sm text-gray-600">{log.servingSize}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(log.mealType)}`}>
                                                {log.mealType}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteFood(log.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div className="text-center">
                                            <div className="font-semibold text-blue-600">{log.calories}</div>
                                            <div className="text-gray-600">Cal</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-red-600">{log.protein}g</div>
                                            <div className="text-gray-600">Protein</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-orange-600">{log.carbs}g</div>
                                            <div className="text-gray-600">Carbs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-green-600">{log.fat}g</div>
                                            <div className="text-gray-600">Fat</div>
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-500 mt-2">
                                        Logged at {formatTime(log.timestamp)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            {foodLogs.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Daily Totals for {selectedDate}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {foodLogs.reduce((sum, log) => sum + log.calories, 0)}
                            </div>
                            <div className="text-sm text-gray-600">Total Calories</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {foodLogs.reduce((sum, log) => sum + log.protein, 0).toFixed(1)}g
                            </div>
                            <div className="text-sm text-gray-600">Total Protein</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {foodLogs.reduce((sum, log) => sum + log.carbs, 0).toFixed(1)}g
                            </div>
                            <div className="text-sm text-gray-600">Total Carbs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {foodLogs.reduce((sum, log) => sum + log.fat, 0).toFixed(1)}g
                            </div>
                            <div className="text-sm text-gray-600">Total Fat</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FoodLoggingComponent
