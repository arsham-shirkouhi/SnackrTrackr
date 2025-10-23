import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    Calendar,
    Target,
    TrendingUp,
    Flame,
    Apple,
    Zap,
    Clock,
    Award
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

interface WeeklyData {
    day: string
    calories: number
    protein: number
    carbs: number
    fat: number
}

export const Dashboard: React.FC = () => {
    const { user, userProfile } = useAuth()
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
    const [loading, setLoading] = useState(true)

    // Mock data - in real app, this would come from Firestore
    useEffect(() => {
        const mockWeeklyData: WeeklyData[] = [
            { day: 'Mon', calories: 1850, protein: 120, carbs: 200, fat: 65 },
            { day: 'Tue', calories: 2100, protein: 140, carbs: 250, fat: 70 },
            { day: 'Wed', calories: 1950, protein: 130, carbs: 220, fat: 68 },
            { day: 'Thu', calories: 2200, protein: 150, carbs: 280, fat: 75 },
            { day: 'Fri', calories: 1800, protein: 110, carbs: 190, fat: 60 },
            { day: 'Sat', calories: 2400, protein: 160, carbs: 300, fat: 80 },
            { day: 'Sun', calories: 2000, protein: 135, carbs: 240, fat: 70 },
        ]

        const mockTodayLog: DailyLog = {
            date: new Date().toISOString().split('T')[0],
            calories: 1950,
            protein: 130,
            carbs: 220,
            fat: 68,
            meals: 3
        }

        setWeeklyData(mockWeeklyData)
        setTodayLog(mockTodayLog)
        setLoading(false)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    const today = new Date()
    const currentHour = today.getHours()
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

    const calorieProgress = userProfile ? (todayLog?.calories || 0) / userProfile.goals.dailyCalories : 0
    const proteinProgress = userProfile ? (todayLog?.protein || 0) / userProfile.goals.protein : 0
    const carbsProgress = userProfile ? (todayLog?.carbs || 0) / userProfile.goals.carbs : 0
    const fatProgress = userProfile ? (todayLog?.fat || 0) / userProfile.goals.fat : 0

    const macroData = [
        { name: 'Protein', value: todayLog?.protein || 0, color: '#3B82F6' },
        { name: 'Carbs', value: todayLog?.carbs || 0, color: '#10B981' },
        { name: 'Fat', value: todayLog?.fat || 0, color: '#F59E0B' },
    ]

    const getProgressColor = (progress: number) => {
        if (progress >= 1) return 'text-green-600'
        if (progress >= 0.8) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getProgressBarColor = (progress: number) => {
        if (progress >= 1) return 'bg-green-500'
        if (progress >= 0.8) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {greeting}, {user?.email?.split('@')[0]}! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Here's your nutrition overview for today
                    </p>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {today.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Calories</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {todayLog?.calories || 0}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                / {userProfile?.goals.dailyCalories || 2000} kcal
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <Flame className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(calorieProgress)}`}
                                style={{ width: `${Math.min(calorieProgress * 100, 100)}%` }}
                            />
                        </div>
                        <p className={`text-sm mt-1 ${getProgressColor(calorieProgress)}`}>
                            {Math.round(calorieProgress * 100)}% of goal
                        </p>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Protein</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {todayLog?.protein || 0}g
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                / {userProfile?.goals.protein || 150}g
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(proteinProgress)}`}
                                style={{ width: `${Math.min(proteinProgress * 100, 100)}%` }}
                            />
                        </div>
                        <p className={`text-sm mt-1 ${getProgressColor(proteinProgress)}`}>
                            {Math.round(proteinProgress * 100)}% of goal
                        </p>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meals</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {todayLog?.meals || 0}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                logged today
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <Apple className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">7</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                days in a row
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                            <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Calorie Trend */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Weekly Calorie Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--tw-bg-white)',
                                        border: '1px solid var(--tw-border-gray-200)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="calories"
                                    stroke="#0ea5e9"
                                    fill="#0ea5e9"
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Macro Distribution */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Today's Macro Distribution
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={macroData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
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
                    <div className="mt-4 space-y-2">
                        {macroData.map((macro) => (
                            <div key={macro.name} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: macro.color }}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
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

            {/* Recent Activity */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Activity
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <Apple className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Logged breakfast: Greek Yogurt Bowl
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                2 hours ago • 320 calories
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Goal progress: 85% of daily calories
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                1 hour ago
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                            <Award className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Weekly streak: 7 days in a row!
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Yesterday
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
