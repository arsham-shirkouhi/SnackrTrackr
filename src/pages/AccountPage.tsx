import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
    User,
    LogOut,
    Sun,
    Moon,
    Weight,
    Ruler,
    Calendar,
    Activity
} from 'lucide-react'

export const AccountPage: React.FC = () => {
    const { user, userProfile, logout } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login')
        } catch (error) {
            console.error('Error logging out:', error)
            alert('Failed to logout. Please try again.')
        }
    }

    const getActivityLevelLabel = (level: string) => {
        const labels: { [key: string]: string } = {
            sedentary: 'Sedentary',
            light: 'Light',
            moderate: 'Moderate',
            active: 'Active',
            very_active: 'Very Active'
        }
        return labels[level] || level
    }

    const calculateBMI = () => {
        if (!userProfile?.weight || !userProfile?.height) return null
        const heightInMeters = userProfile.height / 100
        const bmi = userProfile.weight / (heightInMeters * heightInMeters)
        return bmi.toFixed(1)
    }

    return (
        <div className="space-y-3 animate-fadeIn pt-4">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Account
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Profile Header */}
            <div className="card">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Account</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <div className="card">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {userProfile?.weight && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-1 mb-0.5">
                                <Weight className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Weight</span>
                            </div>
                            <p className="text-base font-bold text-gray-900 dark:text-white">{userProfile.weight} kg</p>
                        </div>
                    )}
                    {userProfile?.height && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-1 mb-0.5">
                                <Ruler className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Height</span>
                            </div>
                            <p className="text-base font-bold text-gray-900 dark:text-white">{userProfile.height} cm</p>
                        </div>
                    )}
                    {userProfile?.age && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-1 mb-0.5">
                                <Calendar className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Age</span>
                            </div>
                            <p className="text-base font-bold text-gray-900 dark:text-white">{userProfile.age} years</p>
                        </div>
                    )}
                    {userProfile?.activityLevel && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-1 mb-0.5">
                                <Activity className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Activity</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{getActivityLevelLabel(userProfile.activityLevel)}</p>
                        </div>
                    )}
                </div>
                {userProfile?.weight && userProfile?.height && calculateBMI() && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-700 dark:text-blue-300">BMI</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{calculateBMI()}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Preferences & Security Combined */}
            <div className="card">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Settings</h2>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            {isDark ? (
                                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                            <span className="text-xs font-medium text-gray-900 dark:text-white">Theme</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="px-3 py-1 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 text-xs font-medium"
                        >
                            Switch
                        </button>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <div className="card">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}

