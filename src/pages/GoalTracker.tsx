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
    AlertCircle,
    Trophy
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
}

export const GoalTracker: React.FC = () => {
    const { user, userProfile, todayTrackingData, getTrackingDataRange } = useAuth()
    const [goals, setGoals] = useState<Goal[]>([])
    const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([])
    const [isEditingGoals, setIsEditingGoals] = useState(false)
    const [newGoal, setNewGoal] = useState({
        type: 'calories' as Goal['type'],
        target: '',
        unit: '',
        endDate: ''
    })

    // Fetch goals and progress from Firebase
    useEffect(() => {
        const fetchGoalData = async () => {
            if (!user || !userProfile) {
                return
            }

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

                // Fetch last 4 weeks of data for weekly progress
                const today = new Date()
                const fourWeeksAgo = new Date(today)
                fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28) // 4 weeks ago
                const startDate = fourWeeksAgo.toISOString().split('T')[0]
                const endDate = today.toISOString().split('T')[0]

                const trackingData = await getTrackingDataRange(startDate, endDate)

                // Group data by week
                const weeklyDataMap: { [week: string]: { calories: number[], protein: number[], weight: number[] } } = {}

                trackingData.forEach(tracking => {
                    const trackingDate = new Date(tracking.date)
                    const weekStart = new Date(trackingDate)
                    weekStart.setDate(trackingDate.getDate() - trackingDate.getDay()) // Start of week (Sunday)
                    const weekKey = `Week ${weekStart.toISOString().split('T')[0]}`

                    if (!weeklyDataMap[weekKey]) {
                        weeklyDataMap[weekKey] = { calories: [], protein: [], weight: [] }
                    }

                    weeklyDataMap[weekKey].calories.push(tracking.caloriesConsumed || 0)
                    weeklyDataMap[weekKey].protein.push(tracking.proteinConsumed || 0)
                    if (tracking.weight > 0) {
                        weeklyDataMap[weekKey].weight.push(tracking.weight)
                    }
                })

                // Calculate averages for each week
                const weeklyProgressData: WeeklyProgress[] = Object.keys(weeklyDataMap)
                    .sort()
                    .slice(-4) // Last 4 weeks
                    .map((weekKey, index) => {
                        const weekData = weeklyDataMap[weekKey]
                        const avgCalories = weekData.calories.length > 0
                            ? weekData.calories.reduce((sum, val) => sum + val, 0) / weekData.calories.length
                            : 0
                        const avgProtein = weekData.protein.length > 0
                            ? weekData.protein.reduce((sum, val) => sum + val, 0) / weekData.protein.length
                            : 0
                        const avgWeight = weekData.weight.length > 0
                            ? weekData.weight.reduce((sum, val) => sum + val, 0) / weekData.weight.length
                            : userProfile.weight

                        return {
                            week: `Week ${index + 1}`,
                            calories: Math.round(avgCalories),
                            protein: Math.round(avgProtein),
                            weight: avgWeight
                        }
                    })

                // If we don't have 4 weeks of data, pad with zeros
                while (weeklyProgressData.length < 4) {
                    weeklyProgressData.unshift({
                        week: `Week ${4 - weeklyProgressData.length}`,
                        calories: 0,
                        protein: 0,
                        weight: userProfile.weight || 0
                    })
                }

                setWeeklyProgress(weeklyProgressData.slice(0, 4))
            } catch (error) {
                console.error('Error fetching goal data:', error)
            }
        }

        fetchGoalData()
    }, [user, userProfile, todayTrackingData, getTrackingDataRange])

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
        switch (type) {
            case 'calories': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
            case 'protein': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
            case 'carbs': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
            case 'fat': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
            case 'weight': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
            case 'workout': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
        }
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

    const addGoal = () => {
        if (!newGoal.target || !newGoal.unit || !newGoal.endDate) return

        const goal: Goal = {
            id: Date.now().toString(),
            type: newGoal.type,
            target: parseFloat(newGoal.target),
            current: 0,
            unit: newGoal.unit,
            startDate: new Date(),
            endDate: new Date(newGoal.endDate),
            isActive: true
        }

        setGoals([...goals, goal])
        setNewGoal({ type: 'calories', target: '', unit: '', endDate: '' })
    }

    const updateGoal = (id: string, updates: Partial<Goal>) => {
        setGoals(goals.map(goal =>
            goal.id === id ? { ...goal, ...updates } : goal
        ))
    }

    const deleteGoal = (id: string) => {
        setGoals(goals.filter(goal => goal.id !== id))
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Goal Tracker
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Set and track your nutrition and fitness goals
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

            {/* Goals Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const progress = getProgressPercentage(goal.current, goal.target)
                    const status = getProgressStatus(goal.current, goal.target, goal.type)

                    return (
                        <div key={goal.id} className="card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${getGoalColor(goal.type)}`}>
                                        {getGoalIcon(goal.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {getGoalTypeLabel(goal.type)}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {goal.current.toFixed(1)} / {goal.target} {goal.unit}
                                        </p>
                                    </div>
                                </div>
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                    {getStatusIcon(status)}
                                    <span className="capitalize">{status.replace('-', ' ')}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        <span>Progress</span>
                                        <span>{progress.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${status === 'excellent' ? 'bg-green-500' :
                                                status === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Started: {goal.startDate.toLocaleDateString()}</span>
                                    <span>Target: {goal.endDate.toLocaleDateString()}</span>
                                </div>

                                {isEditingGoals && (
                                    <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => updateGoal(goal.id, { isActive: !goal.isActive })}
                                            className="flex-1 btn-secondary text-xs"
                                        >
                                            {goal.isActive ? 'Pause' : 'Resume'}
                                        </button>
                                        <button
                                            onClick={() => deleteGoal(goal.id)}
                                            className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 text-xs px-3 py-1 rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Add New Goal */}
            {isEditingGoals && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Add New Goal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                <option value="workout">Weekly Workouts</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Target Value
                            </label>
                            <input
                                type="number"
                                value={newGoal.target}
                                onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                                className="input-field"
                                placeholder="Enter target value"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Unit
                            </label>
                            <input
                                type="text"
                                value={newGoal.unit}
                                onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                                className="input-field"
                                placeholder={getGoalUnits(newGoal.type)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Target Date
                            </label>
                            <input
                                type="date"
                                value={newGoal.endDate}
                                onChange={(e) => setNewGoal({ ...newGoal, endDate: e.target.value })}
                                className="input-field"
                            />
                        </div>
                    </div>
                    <button
                        onClick={addGoal}
                        className="btn-primary flex items-center space-x-2 mt-4"
                    >
                        <Save className="w-4 h-4" />
                        <span>Add Goal</span>
                    </button>
                </div>
            )}

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Progress */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Weekly Progress
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyProgress}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="calories"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    name="Calories"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="protein"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Protein (g)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Weight Progress */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Weight Progress
                    </h3>
                    <div className="h-64">
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
                    </div>
                </div>
            </div>

            {/* Achievements */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Achievements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Trophy className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-green-900 dark:text-green-300">
                                Calorie Goal Met
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Hit your daily calorie target 5 days in a row
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-300">
                                Protein Champion
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Exceeded protein goal 3 days this week
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Award className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-medium text-purple-900 dark:text-purple-300">
                                Consistency King
                            </p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">
                                Logged meals for 7 consecutive days
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
