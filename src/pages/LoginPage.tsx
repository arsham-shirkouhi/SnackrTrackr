import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Utensils, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Profile fields for signup
    const [weight, setWeight] = useState('')
    const [height, setHeight] = useState('')
    const [age, setAge] = useState('')
    const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate')

    const { signIn, signUp } = useAuth()
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isLogin) {
                await signIn(email, password)
            } else {
                if (!weight || !height || !age) {
                    setError('Please fill in all profile fields')
                    setLoading(false)
                    return
                }
                await signUp(email, password, {
                    weight: parseFloat(weight),
                    height: parseFloat(height),
                    age: parseInt(age),
                    activityLevel
                })
            }
            navigate(from, { replace: true })
        } catch (error: any) {
            setError(error.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const calculateDailyCalories = () => {
        if (!weight || !height || !age) return 2000

        const weightNum = parseFloat(weight)
        const heightNum = parseFloat(height)
        const ageNum = parseInt(age)

        // BMR calculation (Mifflin-St Jeor Equation)
        const bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5

        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9
        }

        return Math.round(bmr * activityMultipliers[activityLevel])
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Utensils className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                        {isLogin ? 'Welcome back!' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {isLogin ? 'Sign in to continue tracking your nutrition' : 'Start your healthy journey today'}
                    </p>
                </div>

                {/* Form */}
                <div className="card">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pr-10"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Profile fields for signup */}
                        {!isLogin && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Weight (kg)
                                        </label>
                                        <input
                                            id="weight"
                                            name="weight"
                                            type="number"
                                            required
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="input-field"
                                            placeholder="70"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Height (cm)
                                        </label>
                                        <input
                                            id="height"
                                            name="height"
                                            type="number"
                                            required
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            className="input-field"
                                            placeholder="170"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Age
                                    </label>
                                    <input
                                        id="age"
                                        name="age"
                                        type="number"
                                        required
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        className="input-field"
                                        placeholder="25"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Activity Level
                                    </label>
                                    <select
                                        id="activityLevel"
                                        value={activityLevel}
                                        onChange={(e) => setActivityLevel(e.target.value as any)}
                                        className="input-field"
                                    >
                                        <option value="sedentary">Sedentary (little/no exercise)</option>
                                        <option value="light">Light (light exercise 1-3 days/week)</option>
                                        <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                                        <option value="active">Active (hard exercise 6-7 days/week)</option>
                                        <option value="very_active">Very Active (very hard exercise, physical job)</option>
                                    </select>
                                </div>

                                {weight && height && age && (
                                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                                        <p className="text-sm text-primary-700 dark:text-primary-300">
                                            <strong>Estimated daily calories:</strong> {calculateDailyCalories()} kcal
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : null}
                            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError('')
                            }}
                            className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track your nutrition • Discover recipes • Achieve your goals
                    </p>
                </div>
            </div>
        </div>
    )
}
