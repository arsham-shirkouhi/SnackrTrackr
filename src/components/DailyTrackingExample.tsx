import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const DailyTrackingExample: React.FC = () => {
    const {
        user,
        todayTrackingData,
        userTrackingDefaults,
        logMeal,
        logSnack,
        logWaterIntake,
        logExercise,
        updateWeight,
        updateMood,
        updateSleepHours,
        updateTrackingDefaults
    } = useAuth()

    const [mealCalories, setMealCalories] = useState(0)
    const [mealProtein, setMealProtein] = useState(0)
    const [mealCarbs, setMealCarbs] = useState(0)
    const [mealFat, setMealFat] = useState(0)
    const [waterAmount, setWaterAmount] = useState(0.25) // 250ml default
    const [exerciseMinutes, setExerciseMinutes] = useState(0)
    const [exerciseCalories, setExerciseCalories] = useState(0)
    const [weight, setWeight] = useState(0)
    const [mood, setMood] = useState(5)
    const [sleepHours, setSleepHours] = useState(0)

    if (!user) {
        return <div className="p-4 text-center">Please log in to use tracking features</div>
    }

    const handleLogMeal = async () => {
        try {
            await logMeal(mealCalories, mealProtein, mealCarbs, mealFat)
            setMealCalories(0)
            setMealProtein(0)
            setMealCarbs(0)
            setMealFat(0)
            alert('Meal logged successfully!')
        } catch (error) {
            console.error('Error logging meal:', error)
            alert('Error logging meal')
        }
    }

    const handleLogSnack = async () => {
        try {
            await logSnack(mealCalories, mealProtein, mealCarbs, mealFat)
            setMealCalories(0)
            setMealProtein(0)
            setMealCarbs(0)
            setMealFat(0)
            alert('Snack logged successfully!')
        } catch (error) {
            console.error('Error logging snack:', error)
            alert('Error logging snack')
        }
    }

    const handleLogWater = async () => {
        try {
            await logWaterIntake(waterAmount)
            alert(`${waterAmount}L water logged successfully!`)
        } catch (error) {
            console.error('Error logging water:', error)
            alert('Error logging water')
        }
    }

    const handleLogExercise = async () => {
        try {
            await logExercise(exerciseMinutes, exerciseCalories)
            setExerciseMinutes(0)
            setExerciseCalories(0)
            alert('Exercise logged successfully!')
        } catch (error) {
            console.error('Error logging exercise:', error)
            alert('Error logging exercise')
        }
    }

    const handleUpdateWeight = async () => {
        try {
            await updateWeight(weight)
            alert('Weight updated successfully!')
        } catch (error) {
            console.error('Error updating weight:', error)
            alert('Error updating weight')
        }
    }

    const handleUpdateMood = async () => {
        try {
            await updateMood(mood)
            alert('Mood updated successfully!')
        } catch (error) {
            console.error('Error updating mood:', error)
            alert('Error updating mood')
        }
    }

    const handleUpdateSleep = async () => {
        try {
            await updateSleepHours(sleepHours)
            alert('Sleep hours updated successfully!')
        } catch (error) {
            console.error('Error updating sleep:', error)
            alert('Error updating sleep')
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-center mb-8">Daily Tracking Dashboard</h1>

            {/* Today's Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Today's Summary</h2>
                {todayTrackingData ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{todayTrackingData.caloriesConsumed}</div>
                            <div className="text-sm text-gray-600">Calories Consumed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{todayTrackingData.waterIntake}L</div>
                            <div className="text-sm text-gray-600">Water Intake</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{todayTrackingData.exerciseMinutes}</div>
                            <div className="text-sm text-gray-600">Exercise (min)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{todayTrackingData.mood}/10</div>
                            <div className="text-sm text-gray-600">Mood</div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No data for today yet. Start logging your activities!</p>
                )}
            </div>

            {/* User Goals */}
            {userTrackingDefaults && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Goals</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">{userTrackingDefaults.defaultCaloriesGoal}</div>
                            <div className="text-sm text-gray-600">Daily Calories</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">{userTrackingDefaults.defaultWaterGoal}L</div>
                            <div className="text-sm text-gray-600">Water Goal</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">{userTrackingDefaults.defaultExerciseGoal}min</div>
                            <div className="text-sm text-gray-600">Exercise Goal</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-orange-600">{userTrackingDefaults.defaultSleepGoal}h</div>
                            <div className="text-sm text-gray-600">Sleep Goal</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logging Forms */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Meal/Snack Logging */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Log Meal/Snack</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Calories</label>
                            <input
                                type="number"
                                value={mealCalories}
                                onChange={(e) => setMealCalories(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Protein (g)</label>
                            <input
                                type="number"
                                value={mealProtein}
                                onChange={(e) => setMealProtein(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Carbs (g)</label>
                            <input
                                type="number"
                                value={mealCarbs}
                                onChange={(e) => setMealCarbs(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fat (g)</label>
                            <input
                                type="number"
                                value={mealFat}
                                onChange={(e) => setMealFat(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleLogMeal}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Log Meal
                            </button>
                            <button
                                onClick={handleLogSnack}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                Log Snack
                            </button>
                        </div>
                    </div>
                </div>

                {/* Other Activities */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Other Activities</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Water Intake (L)</label>
                            <input
                                type="number"
                                step="0.25"
                                value={waterAmount}
                                onChange={(e) => setWaterAmount(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleLogWater}
                                className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Log Water
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Exercise Minutes</label>
                            <input
                                type="number"
                                value={exerciseMinutes}
                                onChange={(e) => setExerciseMinutes(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Calories Burned</label>
                            <input
                                type="number"
                                value={exerciseCalories}
                                onChange={(e) => setExerciseCalories(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleLogExercise}
                                className="mt-2 w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                            >
                                Log Exercise
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Updates */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Update Weight</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleUpdateWeight}
                            className="mt-2 w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                        >
                            Update Weight
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Update Mood</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mood (1-10)</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={mood}
                            onChange={(e) => setMood(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleUpdateMood}
                            className="mt-2 w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                        >
                            Update Mood
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Update Sleep</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sleep Hours</label>
                        <input
                            type="number"
                            step="0.5"
                            value={sleepHours}
                            onChange={(e) => setSleepHours(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleUpdateSleep}
                            className="mt-2 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Update Sleep
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DailyTrackingExample
