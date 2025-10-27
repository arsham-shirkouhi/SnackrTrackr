import React, { createContext, useContext, useEffect, useState } from 'react'
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
    userTrackingService,
    DailyTrackingData,
    UserTrackingDefaults,
    UserPreferences,
    FoodLogEntry
} from '../services/userTrackingService'

interface UserProfile {
    email: string
    weight: number // Default: 0
    height: number // Default: 0
    age: number // Default: 0
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
    goals: {
        dailyCalories: number // Default: 0
        protein: number // Default: 0
        carbs: number // Default: 0
        fat: number // Default: 0
    }
    savedRecipes: string[]
    createdAt: Date
}

interface AuthContextType {
    user: User | null
    userProfile: UserProfile | null
    userTrackingDefaults: UserTrackingDefaults | null
    userPreferences: UserPreferences | null
    todayTrackingData: DailyTrackingData | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, profile: Partial<UserProfile>, preferences?: Partial<UserPreferences>) => Promise<void>
    logout: () => Promise<void>
    updateProfile: (profile: Partial<UserProfile>) => Promise<void>
    // Daily tracking methods
    updateTodayTracking: (updates: Partial<DailyTrackingData>) => Promise<void>
    logMeal: (calories: number, protein: number, carbs: number, fat: number) => Promise<void>
    logSnack: (calories: number, protein: number, carbs: number, fat: number) => Promise<void>
    logWaterIntake: (liters: number) => Promise<void>
    logExercise: (minutes: number, caloriesBurned: number) => Promise<void>
    updateWeight: (weight: number) => Promise<void>
    updateMood: (mood: number) => Promise<void>
    updateSleepHours: (hours: number) => Promise<void>
    updateTrackingDefaults: (updates: Partial<UserTrackingDefaults>) => Promise<void>
    getTrackingDataRange: (startDate: string, endDate: string) => Promise<DailyTrackingData[]>
    getAllTrackingData: () => Promise<DailyTrackingData[]>
    // User preferences methods
    updateUserPreferences: (updates: Partial<UserPreferences>) => Promise<void>
    // Food logging methods
    logFoodItem: (foodName: string, calories: number, protein: number, carbs: number, fat: number, servingSize: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => Promise<string>
    getFoodLogsByDate: (date: string) => Promise<FoodLogEntry[]>
    getFoodLogsByDateRange: (startDate: string, endDate: string) => Promise<FoodLogEntry[]>
    getAllUserFoodLogs: () => Promise<FoodLogEntry[]>
    deleteFoodLogEntry: (foodLogId: string) => Promise<void>
    getFoodLogsByMealType: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', date?: string) => Promise<FoodLogEntry[]>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [userTrackingDefaults, setUserTrackingDefaults] = useState<UserTrackingDefaults | null>(null)
    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
    const [todayTrackingData, setTodayTrackingData] = useState<DailyTrackingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user)
            if (user) {
                // Fetch user profile from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid))
                    if (userDoc.exists()) {
                        const profileData = userDoc.data()
                        console.log('User profile loaded:', profileData)
                        setUserProfile({
                            ...profileData,
                            createdAt: profileData.createdAt?.toDate() || new Date()
                        } as UserProfile)

                        // Load tracking defaults, preferences, and today's data for existing user
                        try {
                            const trackingDefaults = await userTrackingService.getUserTrackingDefaults(user.uid)
                            setUserTrackingDefaults(trackingDefaults)
                        } catch (error) {
                            console.warn('Could not load tracking defaults (permissions issue):', error)
                            setUserTrackingDefaults(null)
                        }

                        try {
                            const userPrefs = await userTrackingService.getUserPreferences(user.uid)
                            setUserPreferences(userPrefs)
                        } catch (error) {
                            console.warn('Could not load user preferences (permissions issue):', error)
                            setUserPreferences(null)
                        }

                        try {
                            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
                            setTodayTrackingData(todayData)
                        } catch (error) {
                            console.warn('Could not load today tracking data (permissions issue):', error)
                            setTodayTrackingData(null)
                        }
                    } else {
                        // If user document doesn't exist, create it
                        console.log('User document not found, creating default profile...')
                        const defaultProfile: UserProfile = {
                            email: user.email || '',
                            weight: 0,
                            height: 0,
                            age: 0,
                            activityLevel: 'moderate',
                            goals: {
                                dailyCalories: 0,
                                protein: 0,
                                carbs: 0,
                                fat: 0
                            },
                            savedRecipes: [],
                            createdAt: new Date()
                        }

                        await setDoc(doc(db, 'users', user.uid), {
                            ...defaultProfile,
                            createdAt: new Date()
                        })
                        console.log('Default user profile created')
                        setUserProfile(defaultProfile)

                        // Initialize tracking defaults and preferences for new user
                        try {
                            const trackingDefaults = await userTrackingService.initializeUserTrackingDefaults(user.uid)
                            setUserTrackingDefaults(trackingDefaults)
                        } catch (error) {
                            console.warn('Could not initialize tracking defaults (permissions issue):', error)
                            setUserTrackingDefaults(null)
                        }

                        try {
                            const userPrefs = await userTrackingService.initializeUserPreferences(user.uid)
                            setUserPreferences(userPrefs)
                        } catch (error) {
                            console.warn('Could not initialize user preferences (permissions issue):', error)
                            setUserPreferences(null)
                        }

                        // Get today's tracking data
                        try {
                            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
                            setTodayTrackingData(todayData)
                        } catch (error) {
                            console.warn('Could not load today tracking data (permissions issue):', error)
                            setTodayTrackingData(null)
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error)
                    // Create a default profile if there's an error
                    const defaultProfile: UserProfile = {
                        email: user.email || '',
                        weight: 0,
                        height: 0,
                        age: 0,
                        activityLevel: 'moderate',
                        goals: {
                            dailyCalories: 0,
                            protein: 0,
                            carbs: 0,
                            fat: 0
                        },
                        savedRecipes: [],
                        createdAt: new Date()
                    }
                    setUserProfile(defaultProfile)

                    // Initialize tracking defaults and preferences for error case
                    try {
                        const trackingDefaults = await userTrackingService.initializeUserTrackingDefaults(user.uid)
                        setUserTrackingDefaults(trackingDefaults)
                    } catch (error) {
                        console.warn('Could not initialize tracking defaults (permissions issue):', error)
                        setUserTrackingDefaults(null)
                    }

                    try {
                        const userPrefs = await userTrackingService.initializeUserPreferences(user.uid)
                        setUserPreferences(userPrefs)
                    } catch (error) {
                        console.warn('Could not initialize user preferences (permissions issue):', error)
                        setUserPreferences(null)
                    }

                    try {
                        const todayData = await userTrackingService.getTodayTrackingData(user.uid)
                        setTodayTrackingData(todayData)
                    } catch (error) {
                        console.warn('Could not load today tracking data (permissions issue):', error)
                        setTodayTrackingData(null)
                    }
                }
            } else {
                setUserProfile(null)
                setUserTrackingDefaults(null)
                setUserPreferences(null)
                setTodayTrackingData(null)
            }
            setLoading(false)
        })

        return unsubscribe
    }, [])

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (error) {
            throw error
        }
    }

    const signUp = async (email: string, password: string, profile: Partial<UserProfile>, preferences?: Partial<UserPreferences>) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Create user profile in Firestore
            const userProfile: UserProfile = {
                email,
                weight: profile.weight || 0,
                height: profile.height || 0,
                age: profile.age || 0,
                activityLevel: profile.activityLevel || 'moderate',
                goals: profile.goals || {
                    dailyCalories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0
                },
                savedRecipes: [],
                createdAt: new Date()
            }

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                ...userProfile,
                createdAt: new Date() // Convert Date to Firestore Timestamp
            })

            setUserProfile(userProfile)

            // Initialize tracking defaults and preferences for new user
            try {
                const trackingDefaults = await userTrackingService.initializeUserTrackingDefaults(user.uid)
                setUserTrackingDefaults(trackingDefaults)
            } catch (error) {
                console.warn('Could not initialize tracking defaults (permissions issue):', error)
                setUserTrackingDefaults(null)
            }

            try {
                const userPrefs = await userTrackingService.initializeUserPreferences(user.uid, preferences)
                setUserPreferences(userPrefs)
            } catch (error) {
                console.warn('Could not initialize user preferences (permissions issue):', error)
                setUserPreferences(null)
            }

            // Get today's tracking data
            try {
                const todayData = await userTrackingService.getTodayTrackingData(user.uid)
                setTodayTrackingData(todayData)
            } catch (error) {
                console.warn('Could not load today tracking data (permissions issue):', error)
                setTodayTrackingData(null)
            }
        } catch (error) {
            console.error('Sign up error:', error)
            throw error
        }
    }

    const logout = async () => {
        try {
            await signOut(auth)
        } catch (error) {
            throw error
        }
    }

    const updateProfile = async (profile: Partial<UserProfile>) => {
        if (!user) return

        try {
            const userRef = doc(db, 'users', user.uid)
            await setDoc(userRef, profile, { merge: true })
            setUserProfile(prev => prev ? { ...prev, ...profile } : null)
        } catch (error) {
            throw error
        }
    }

    // Daily tracking methods
    const updateTodayTracking = async (updates: Partial<DailyTrackingData>) => {
        if (!user) return

        try {
            const updatedData = await userTrackingService.updateTodayTrackingData(user.uid, updates)
            setTodayTrackingData(updatedData)
        } catch (error) {
            throw error
        }
    }

    const logMeal = async (calories: number, protein: number, carbs: number, fat: number) => {
        if (!user) return

        try {
            await userTrackingService.logMeal(user.uid, calories, protein, carbs, fat)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const logSnack = async (calories: number, protein: number, carbs: number, fat: number) => {
        if (!user) return

        try {
            await userTrackingService.logSnack(user.uid, calories, protein, carbs, fat)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const logWaterIntake = async (liters: number) => {
        if (!user) return

        try {
            await userTrackingService.logWaterIntake(user.uid, liters)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const logExercise = async (minutes: number, caloriesBurned: number) => {
        if (!user) return

        try {
            await userTrackingService.logExercise(user.uid, minutes, caloriesBurned)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const updateWeight = async (weight: number) => {
        if (!user) return

        try {
            await userTrackingService.updateWeight(user.uid, weight)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const updateMood = async (mood: number) => {
        if (!user) return

        try {
            await userTrackingService.updateMood(user.uid, mood)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const updateSleepHours = async (hours: number) => {
        if (!user) return

        try {
            await userTrackingService.updateSleepHours(user.uid, hours)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const updateTrackingDefaults = async (updates: Partial<UserTrackingDefaults>) => {
        if (!user) return

        try {
            await userTrackingService.updateUserTrackingDefaults(user.uid, updates)
            // Refresh tracking defaults
            const trackingDefaults = await userTrackingService.getUserTrackingDefaults(user.uid)
            setUserTrackingDefaults(trackingDefaults)
        } catch (error) {
            throw error
        }
    }

    const getTrackingDataRange = async (startDate: string, endDate: string) => {
        if (!user) return []

        try {
            return await userTrackingService.getTrackingDataRange(user.uid, startDate, endDate)
        } catch (error) {
            throw error
        }
    }

    const getAllTrackingData = async () => {
        if (!user) return []

        try {
            return await userTrackingService.getAllUserTrackingData(user.uid)
        } catch (error) {
            throw error
        }
    }

    // User preferences methods
    const updateUserPreferences = async (updates: Partial<UserPreferences>) => {
        if (!user) return

        try {
            await userTrackingService.updateUserPreferences(user.uid, updates)
            // Refresh user preferences
            const userPrefs = await userTrackingService.getUserPreferences(user.uid)
            setUserPreferences(userPrefs)
        } catch (error) {
            throw error
        }
    }

    // Food logging methods
    const logFoodItem = async (
        foodName: string,
        calories: number,
        protein: number,
        carbs: number,
        fat: number,
        servingSize: string,
        mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    ) => {
        if (!user) return ''

        try {
            const foodLogId = await userTrackingService.logFoodItem(
                user.uid,
                foodName,
                calories,
                protein,
                carbs,
                fat,
                servingSize,
                mealType
            )
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
            return foodLogId
        } catch (error) {
            throw error
        }
    }

    const getFoodLogsByDate = async (date: string) => {
        if (!user) return []

        try {
            return await userTrackingService.getFoodLogsByDate(user.uid, date)
        } catch (error) {
            throw error
        }
    }

    const getFoodLogsByDateRange = async (startDate: string, endDate: string) => {
        if (!user) return []

        try {
            return await userTrackingService.getFoodLogsByDateRange(user.uid, startDate, endDate)
        } catch (error) {
            throw error
        }
    }

    const getAllUserFoodLogs = async () => {
        if (!user) return []

        try {
            return await userTrackingService.getAllUserFoodLogs(user.uid)
        } catch (error) {
            throw error
        }
    }

    const deleteFoodLogEntry = async (foodLogId: string) => {
        if (!user) return

        try {
            await userTrackingService.deleteFoodLogEntry(foodLogId, user.uid)
            // Refresh today's data
            const todayData = await userTrackingService.getTodayTrackingData(user.uid)
            setTodayTrackingData(todayData)
        } catch (error) {
            throw error
        }
    }

    const getFoodLogsByMealType = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', date?: string) => {
        if (!user) return []

        try {
            return await userTrackingService.getFoodLogsByMealType(user.uid, mealType, date)
        } catch (error) {
            throw error
        }
    }

    const value = {
        user,
        userProfile,
        userTrackingDefaults,
        userPreferences,
        todayTrackingData,
        loading,
        signIn,
        signUp,
        logout,
        updateProfile,
        // Daily tracking methods
        updateTodayTracking,
        logMeal,
        logSnack,
        logWaterIntake,
        logExercise,
        updateWeight,
        updateMood,
        updateSleepHours,
        updateTrackingDefaults,
        getTrackingDataRange,
        getAllTrackingData,
        // User preferences methods
        updateUserPreferences,
        // Food logging methods
        logFoodItem,
        getFoodLogsByDate,
        getFoodLogsByDateRange,
        getAllUserFoodLogs,
        deleteFoodLogEntry,
        getFoodLogsByMealType
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
