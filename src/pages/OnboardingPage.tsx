import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Utensils, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export const OnboardingPage: React.FC = () => {
    const [weight, setWeight] = useState('')
    const [height, setHeight] = useState('')
    const [age, setAge] = useState('')
    const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { updateProfile } = useAuth()
    const navigate = useNavigate()

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!weight || !height || !age) {
            setError('Please fill in all fields')
            setLoading(false)
            return
        }

        try {
            const dailyCalories = calculateDailyCalories()

            // Calculate macros (example: 30% protein, 40% carbs, 30% fat)
            const proteinGrams = Math.round((dailyCalories * 0.30) / 4)
            const carbsGrams = Math.round((dailyCalories * 0.40) / 4)
            const fatGrams = Math.round((dailyCalories * 0.30) / 9)

            await updateProfile({
                weight: parseFloat(weight),
                height: parseFloat(height),
                age: parseInt(age),
                activityLevel,
                goals: {
                    dailyCalories,
                    protein: proteinGrams,
                    carbs: carbsGrams,
                    fat: fatGrams
                },
                onboardingCompleted: true
            })

            navigate('/', { replace: true })
        } catch (error: any) {
            setError(error.message || 'An error occurred while saving your information')
        } finally {
            setLoading(false)
        }
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
                        Let's get to know you
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Help us personalize your nutrition tracking experience
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
                                    min="1"
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
                                    min="1"
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
                                min="1"
                                max="120"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Complete Setup</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

