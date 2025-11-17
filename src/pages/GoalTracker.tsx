import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    Target,
    TrendingUp,
    Award,
    Flame,
    Zap,
    Apple,
    Save,
    Edit3,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { getLocalDateString, getTodayDateString } from '../utils/dateUtils'

interface Goal {
    id: string
    type: 'calories' | 'protein' | 'carbs' | 'fat' | 'weight' | 'workout'
    target: number
    current: number
    unit: string
    startDate: Date
    endDate: Date
    isActive: boolean
}

interface WeeklyProgress {
    week: string
    calories: number
    protein: number
    weight: number
    weekStartDate?: string // Store the actual week start date for editing
}

interface DailyCalories {
    day: string
    calories: number
}

export const GoalTracker: React.FC = () => {
    const { user, userProfile, todayTrackingData, getTrackingDataRange, updateProfile, updateWeight } = useAuth()
    const [goals, setGoals] = useState<Goal[]>([])
    const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([])
    const [dailyCalories, setDailyCalories] = useState<DailyCalories[]>([])
    const [isEditingGoals, setIsEditingGoals] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [newGoal, setNewGoal] = useState({
        type: 'calories' as Goal['type'],
        target: ''
    })
    const [isUpdatingWeight, setIsUpdatingWeight] = useState(false)
    const [newWeight, setNewWeight] = useState('')
    const [selectedWeightDate, setSelectedWeightDate] = useState<string | null>(null)
    const [weightUpdateSuccess, setWeightUpdateSuccess] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Fetch goals and progress from Firebase
    useEffect(() => {
        const fetchGoalData = async () => {
            if (!user || !userProfile) {
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                // Create goals from userProfile
                const userGoals: Goal[] = []

                if (userProfile.goals.dailyCalories > 0) {
                    const todayCalories = todayTrackingData?.caloriesConsumed || 0
                    userGoals.push({
                        id: 'calories-goal',
                        type: 'calories',
                        target: userProfile.goals.dailyCalories,
                        current: todayCalories,
                        unit: 'kcal',
                        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        isActive: true
                    })
                }

                if (userProfile.goals.protein > 0) {
                    const todayProtein = todayTrackingData?.proteinConsumed || 0
                    userGoals.push({
                        id: 'protein-goal',
                        type: 'protein',
                        target: userProfile.goals.protein,
                        current: todayProtein,
                        unit: 'g',
                        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        isActive: true
                    })
                }

                if (userProfile.goals.carbs > 0) {
                    const todayCarbs = todayTrackingData?.carbsConsumed || 0
                    userGoals.push({
                        id: 'carbs-goal',
                        type: 'carbs',
                        target: userProfile.goals.carbs,
                        current: todayCarbs,
                        unit: 'g',
                        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        isActive: true
                    })
                }

                if (userProfile.goals.fat > 0) {
                    const todayFat = todayTrackingData?.fatConsumed || 0
                    userGoals.push({
                        id: 'fat-goal',
                        type: 'fat',
                        target: userProfile.goals.fat,
                        current: todayFat,
                        unit: 'g',
                        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        isActive: true
                    })
                }

                if (userProfile.weight > 0) {
                    const currentWeight = todayTrackingData?.weight || userProfile.weight
                    userGoals.push({
                        id: 'weight-goal',
                        type: 'weight',
                        target: userProfile.weight,
                        current: currentWeight,
                        unit: 'kg',
                        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                        isActive: true
                    })
                }

                setGoals(userGoals)

                // Fetch last 12 weeks of data for weekly progress (3 months)
                const today = new Date()
                const twelveWeeksAgo = new Date(today)
                twelveWeeksAgo.setDate(today.getDate() - 84) // 12 weeks ago
                const startDate = getLocalDateString(twelveWeeksAgo)
                const endDate = getTodayDateString()

                const trackingData = await getTrackingDataRange(startDate, endDate)

                // Group data by week
                const weeklyDataMap: { [weekKey: string]: { weekStartDate: string, calories: number[], protein: number[], weight: number[] } } = {}

                trackingData.forEach(tracking => {
                    const trackingDate = new Date(tracking.date)
                    const weekStart = new Date(trackingDate)
                    weekStart.setDate(trackingDate.getDate() - trackingDate.getDay()) // Start of week (Sunday)
                    const weekStartDateStr = getLocalDateString(weekStart)
                    const weekKey = weekStartDateStr

                    if (!weeklyDataMap[weekKey]) {
                        weeklyDataMap[weekKey] = { weekStartDate: weekStartDateStr, calories: [], protein: [], weight: [] }
                    }

                    weeklyDataMap[weekKey].calories.push(tracking.caloriesConsumed || 0)
                    weeklyDataMap[weekKey].protein.push(tracking.proteinConsumed || 0)
                    if (tracking.weight > 0) {
                        weeklyDataMap[weekKey].weight.push(tracking.weight)
                    }
                })

                // Calculate averages for each week - show all weeks with data
                const weeklyProgressData: WeeklyProgress[] = Object.keys(weeklyDataMap)
                    .sort()
                    .map((weekKey) => {
                        const weekData = weeklyDataMap[weekKey]
                        const avgCalories = weekData.calories.length > 0
                            ? weekData.calories.reduce((sum, val) => sum + val, 0) / weekData.calories.length
                            : 0
                        const avgProtein = weekData.protein.length > 0
                            ? weekData.protein.reduce((sum, val) => sum + val, 0) / weekData.protein.length
                            : 0
                        const avgWeight = weekData.weight.length > 0
                            ? weekData.weight.reduce((sum, val) => sum + val, 0) / weekData.weight.length
                            : 0

                        // Format week label with date
                        const weekStartDate = new Date(weekData.weekStartDate)
                        const weekLabel = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                        return {
                            week: weekLabel,
                            calories: Math.round(avgCalories),
                            protein: Math.round(avgProtein),
                            weight: avgWeight,
                            weekStartDate: weekData.weekStartDate
                        }
                    })
                    .filter(week => week.weight > 0 || week.calories > 0) // Only show weeks with data

                setWeeklyProgress(weeklyProgressData)

                // Fetch past 7 days of daily calorie data
                const sevenDaysAgo = new Date(today)
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // 6 days ago + today = 7 days
                const sevenDaysStartDate = getLocalDateString(sevenDaysAgo)
                const sevenDaysEndDate = getTodayDateString()

                const dailyTrackingData = await getTrackingDataRange(sevenDaysStartDate, sevenDaysEndDate)

                // Create a map of date to calories
                const dateToCaloriesMap: { [date: string]: number } = {}
                dailyTrackingData.forEach(tracking => {
                    dateToCaloriesMap[tracking.date] = tracking.caloriesConsumed || 0
                })

                // Create array for past 7 days with proper day labels
                const dailyCaloriesData: DailyCalories[] = []
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today)
                    date.setDate(date.getDate() - i)
                    const dateStr = getLocalDateString(date)
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

                    dailyCaloriesData.push({
                        day: dayName,
                        calories: dateToCaloriesMap[dateStr] || 0
                    })
                }

                setDailyCalories(dailyCaloriesData)
            } catch (error) {
                console.error('Error fetching goal data:', error)
                setError('Failed to load goal data. Please try again later.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchGoalData()
    }, [user, userProfile, todayTrackingData, getTrackingDataRange, refreshTrigger])

    const getGoalIcon = (type: Goal['type']) => {
        switch (type) {
            case 'calories': return <Flame className="w-5 h-5" />
            case 'protein': return <Target className="w-5 h-5" />
            case 'carbs': return <Zap className="w-5 h-5" />
            case 'fat': return <Apple className="w-5 h-5" />
            case 'weight': return <TrendingUp className="w-5 h-5" />
            case 'workout': return <Award className="w-5 h-5" />
        }
    }

    const getGoalColor = (type: Goal['type']) => {
        // Uniform color for all goal icons
        return 'text-primary-600 bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400'
    }

    const getProgressPercentage = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100)
    }

    const getProgressStatus = (current: number, target: number, type: Goal['type']) => {
        const percentage = getProgressPercentage(current, target)

        if (type === 'weight') {
            // For weight loss, we want to be under target
            return current <= target ? 'excellent' : percentage <= 110 ? 'good' : 'needs-work'
        }

        return percentage >= 90 ? 'excellent' : percentage >= 70 ? 'good' : 'needs-work'
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
            case 'good': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
            case 'needs-work': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'excellent': return <CheckCircle className="w-4 h-4" />
            case 'good': return <AlertCircle className="w-4 h-4" />
            case 'needs-work': return <AlertCircle className="w-4 h-4" />
            default: return <AlertCircle className="w-4 h-4" />
        }
    }

    const addGoal = async () => {
        if (!newGoal.target || !userProfile) return

        try {
            const targetValue = parseFloat(newGoal.target)
            const profileUpdates: any = {}

            switch (newGoal.type) {
                case 'calories':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        dailyCalories: targetValue
                    }
                    break
                case 'protein':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        protein: targetValue
                    }
                    break
                case 'carbs':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        carbs: targetValue
                    }
                    break
                case 'fat':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        fat: targetValue
                    }
                    break
                case 'weight':
                    profileUpdates.weight = targetValue
                    break
                case 'workout':
                    // Workout goals are not supported in profile yet
                    setError('Workout goals are not yet supported. Please check back later!')
                    return
            }

            await updateProfile(profileUpdates)

            // Reset form
            setNewGoal({ type: 'calories', target: '' })
        } catch (error) {
            console.error('Error adding goal:', error)
            setError('Failed to add goal. Please try again.')
        }
    }

    const updateGoal = (id: string, updates: Partial<Goal>) => {
        setGoals(goals.map(goal =>
            goal.id === id ? { ...goal, ...updates } : goal
        ))
    }

    const deleteGoal = async (id: string) => {
        if (!userProfile) return

        // Find the goal to delete
        const goalToDelete = goals.find(goal => goal.id === id)
        if (!goalToDelete) return

        try {
            // Update the user profile to set the goal to 0
            const profileUpdates: any = {}

            switch (goalToDelete.type) {
                case 'calories':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        dailyCalories: 0
                    }
                    break
                case 'protein':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        protein: 0
                    }
                    break
                case 'carbs':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        carbs: 0
                    }
                    break
                case 'fat':
                    profileUpdates.goals = {
                        ...userProfile.goals,
                        fat: 0
                    }
                    break
                case 'weight':
                    profileUpdates.weight = 0
                    break
            }

            await updateProfile(profileUpdates)

            // Remove from local state
            setGoals(goals.filter(goal => goal.id !== id))
        } catch (error) {
            console.error('Error deleting goal:', error)
            setError('Failed to delete goal. Please try again.')
        }
    }

    const getGoalTypeLabel = (type: Goal['type']) => {
        switch (type) {
            case 'calories': return 'Daily Calories'
            case 'protein': return 'Daily Protein'
            case 'carbs': return 'Daily Carbs'
            case 'fat': return 'Daily Fat'
            case 'weight': return 'Target Weight'
            case 'workout': return 'Weekly Workouts'
        }
    }

    const getGoalUnits = (type: Goal['type']) => {
        switch (type) {
            case 'calories': return 'kcal'
            case 'protein': return 'g'
            case 'carbs': return 'g'
            case 'fat': return 'g'
            case 'weight': return 'kg'
            case 'workout': return 'sessions'
        }
    }

    const handleUpdateWeight = async () => {
        if (!newWeight || !updateWeight) return

        try {
            const weightValue = parseFloat(newWeight)
            if (isNaN(weightValue) || weightValue <= 0) {
                setError('Please enter a valid weight')
                return
            }

            // Use selected date or today's date
            const targetDate = selectedWeightDate || getTodayDateString()
            await updateWeight(weightValue, targetDate)
            setWeightUpdateSuccess(true)
            setNewWeight('')
            setSelectedWeightDate(null)
            setIsUpdatingWeight(false)

            // Trigger a refresh of goal data
            setRefreshTrigger(prev => prev + 1)

            // Clear success message after 3 seconds
            setTimeout(() => {
                setWeightUpdateSuccess(false)
            }, 3000)
        } catch (error) {
            console.error('Error updating weight:', error)
            setError('Failed to update weight. Please try again.')
        }
    }

    const startEditingWeight = (weekStartDate?: string) => {
        setSelectedWeightDate(weekStartDate || null)
        setIsUpdatingWeight(true)
        setNewWeight('')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your summary...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">Error</h3>
                        <p className="text-red-700 dark:text-red-400">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Summary
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Overview of your nutrition and fitness progress
                    </p>
                </div>
                <button
                    onClick={() => setIsEditingGoals(!isEditingGoals)}
                    className="btn-primary flex items-center space-x-2 mt-4 md:mt-0"
                >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditingGoals ? 'Done Editing' : 'Edit Goals'}</span>
                </button>
            </div>

            {/* Empty State */}
            {goals.length === 0 && !isEditingGoals && (
                <div className="card text-center py-12">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No Goals Set Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Start tracking your progress by setting up your nutrition goals in your profile settings.
                    </p>
                    <button
                        onClick={() => setIsEditingGoals(true)}
                        className="btn-primary inline-flex items-center space-x-2"
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Set Up Goals</span>
                    </button>
                </div>
            )}

            {/* Goals Overview */}
            {goals.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => {
                        const progress = getProgressPercentage(goal.current, goal.target)
                        const status = getProgressStatus(goal.current, goal.target, goal.type)

                        return (
                            <div key={goal.id} className="card hover:shadow-lg transition-all duration-300">
                                {/* Header with Title */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {getGoalTypeLabel(goal.type)}
                                    </h3>
                                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                        <span className="capitalize">{status.replace('-', ' ')}</span>
                                    </div>
                                </div>

                                {/* Progress Display - Large and Clear */}
                                <div className="mb-4">
                                    <div className="mb-2">
                                        <div>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {goal.current.toFixed(goal.type === 'weight' ? 1 : 0)}
                                            </span>
                                            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">
                                                / {goal.target} {goal.unit}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Large Progress Bar */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${status === 'excellent' ? 'bg-green-500' :
                                                status === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Date Info - Less Prominent */}
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span>Started: {goal.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span>Target: {goal.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>

                                {isEditingGoals && (
                                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => deleteGoal(goal.id)}
                                            className="w-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 text-sm px-4 py-2 rounded-lg transition-colors font-medium"
                                        >
                                            Remove Goal
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add New Goal */}
            {isEditingGoals && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Set New Goal
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Update your nutrition and fitness goals. These goals will be saved to your profile.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Goal Type
                            </label>
                            <select
                                value={newGoal.type}
                                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as Goal['type'] })}
                                className="input-field"
                            >
                                <option value="calories">Daily Calories</option>
                                <option value="protein">Daily Protein</option>
                                <option value="carbs">Daily Carbs</option>
                                <option value="fat">Daily Fat</option>
                                <option value="weight">Target Weight</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Target Value ({getGoalUnits(newGoal.type)})
                            </label>
                            <input
                                type="number"
                                value={newGoal.target}
                                onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                                className="input-field"
                                placeholder={`Enter target ${getGoalUnits(newGoal.type)}`}
                                min="0"
                                step="any"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={addGoal}
                                disabled={!newGoal.target}
                                className="btn-primary flex items-center justify-center space-x-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Goal</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Charts */}
            {goals.length > 0 && weeklyProgress.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* This Week's Calories */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            This Week's Calories
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyCalories}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="calories"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        name="Calories"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Weight Progress */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Weight Progress
                            </h3>
                            <button
                                onClick={() => startEditingWeight()}
                                className="btn-primary flex items-center space-x-2 text-sm"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isUpdatingWeight ? 'Cancel' : 'Update Weight'}</span>
                            </button>
                        </div>

                        {/* Success Message */}
                        {weightUpdateSuccess && (
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-700 dark:text-green-400">
                                    Weight updated successfully!
                                </span>
                            </div>
                        )}

                        {/* Update Weight Form */}
                        {isUpdatingWeight && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedWeightDate || getTodayDateString()}
                                            onChange={(e) => setSelectedWeightDate(e.target.value)}
                                            className="input-field"
                                            max={getTodayDateString()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            value={newWeight}
                                            onChange={(e) => setNewWeight(e.target.value)}
                                            className="input-field"
                                            placeholder="0.0"
                                            min="0"
                                            step="0.1"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleUpdateWeight}
                                        disabled={!newWeight}
                                        className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>Save</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsUpdatingWeight(false)
                                            setSelectedWeightDate(null)
                                            setNewWeight('')
                                        }}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Chart */}
                        <div className="h-64">
                            {weeklyProgress.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyProgress}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#8b5cf6"
                                            fill="#8b5cf6"
                                            fillOpacity={0.3}
                                            name="Weight (kg)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <div className="text-center">
                                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No weight data yet. Click "Update Weight" to add your first entry.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
