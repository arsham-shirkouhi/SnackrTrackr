import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    orderBy,
    Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

// Interface for daily tracking data
export interface DailyTrackingData {
    userId: string
    date: string // Format: YYYY-MM-DD
    caloriesConsumed: number
    caloriesBurned: number
    proteinConsumed: number
    carbsConsumed: number
    fatConsumed: number
    waterIntake: number // in liters
    weight: number
    mood: number // 1-10 scale
    sleepHours: number
    exerciseMinutes: number
    mealsLogged: number
    snacksLogged: number
    createdAt: Timestamp
    updatedAt: Timestamp
}

// Interface for individual food items logged by users
export interface FoodLogEntry {
    id: string
    userId: string
    date: string // Format: YYYY-MM-DD
    foodName: string
    calories: number
    protein: number
    carbs: number
    fat: number
    servingSize: string
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    timestamp: Timestamp
    createdAt: Timestamp
}

// Interface for user preferences
export interface UserPreferences {
    userId: string
    preferredMealTimes: {
        breakfast: string
        lunch: string
        dinner: string
    }
    dietaryRestrictions: string[]
    allergies: string[]
    favoriteFoods: string[]
    dislikedFoods: string[]
    createdAt: Timestamp
    updatedAt: Timestamp
}

// Interface for user's default tracking values
export interface UserTrackingDefaults {
    userId: string
    defaultCaloriesGoal: number
    defaultProteinGoal: number
    defaultCarbsGoal: number
    defaultFatGoal: number
    defaultWaterGoal: number // in liters
    defaultWeight: number
    defaultSleepGoal: number // in hours
    defaultExerciseGoal: number // in minutes
    createdAt: Timestamp
    updatedAt: Timestamp
}

// Default values for new users - all set to 0
const DEFAULT_TRACKING_VALUES = {
    caloriesConsumed: 0,
    caloriesBurned: 0,
    proteinConsumed: 0,
    carbsConsumed: 0,
    fatConsumed: 0,
    waterIntake: 0,
    weight: 0,
    mood: 0, // Changed from 5 to 0
    sleepHours: 0,
    exerciseMinutes: 0,
    mealsLogged: 0,
    snacksLogged: 0
}

const DEFAULT_USER_GOALS = {
    defaultCaloriesGoal: 0, // Changed from 2000 to 0
    defaultProteinGoal: 0, // Changed from 150 to 0
    defaultCarbsGoal: 0, // Changed from 250 to 0
    defaultFatGoal: 0, // Changed from 67 to 0
    defaultWaterGoal: 0, // Changed from 2 to 0
    defaultWeight: 0, // Changed from 70 to 0
    defaultSleepGoal: 0, // Changed from 8 to 0
    defaultExerciseGoal: 0 // Changed from 30 to 0
}

class UserTrackingService {
    // Get today's date in YYYY-MM-DD format
    private getTodayDateString(): string {
        return new Date().toISOString().split('T')[0]
    }

    // Create or get user's default tracking goals
    async initializeUserTrackingDefaults(userId: string): Promise<UserTrackingDefaults> {
        try {
            const userDefaultsRef = doc(db, 'userTrackingDefaults', userId)
            const userDefaultsDoc = await getDoc(userDefaultsRef)

            if (!userDefaultsDoc.exists()) {
                // Create default tracking goals for new user
                const newDefaults: UserTrackingDefaults = {
                    userId,
                    ...DEFAULT_USER_GOALS,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                }

                await setDoc(userDefaultsRef, newDefaults)
                console.log('User tracking defaults created for user:', userId)
                return newDefaults
            }

            return userDefaultsDoc.data() as UserTrackingDefaults
        } catch (error) {
            console.error('Error initializing user tracking defaults:', error)
            throw error
        }
    }

    // Get user's tracking defaults
    async getUserTrackingDefaults(userId: string): Promise<UserTrackingDefaults | null> {
        try {
            const userDefaultsRef = doc(db, 'userTrackingDefaults', userId)
            const userDefaultsDoc = await getDoc(userDefaultsRef)

            if (userDefaultsDoc.exists()) {
                return userDefaultsDoc.data() as UserTrackingDefaults
            }

            return null
        } catch (error) {
            console.error('Error getting user tracking defaults:', error)
            throw error
        }
    }

    // Update user's tracking defaults
    async updateUserTrackingDefaults(userId: string, updates: Partial<UserTrackingDefaults>): Promise<void> {
        try {
            const userDefaultsRef = doc(db, 'userTrackingDefaults', userId)
            await updateDoc(userDefaultsRef, {
                ...updates,
                updatedAt: Timestamp.now()
            })
            console.log('User tracking defaults updated for user:', userId)
        } catch (error) {
            console.error('Error updating user tracking defaults:', error)
            throw error
        }
    }

    // Get today's tracking data for a user
    async getTodayTrackingData(userId: string): Promise<DailyTrackingData | null> {
        try {
            const today = this.getTodayDateString()
            const trackingRef = doc(db, 'dailyTracking', `${userId}_${today}`)
            const trackingDoc = await getDoc(trackingRef)

            if (trackingDoc.exists()) {
                return trackingDoc.data() as DailyTrackingData
            }

            return null
        } catch (error) {
            console.error('Error getting today\'s tracking data:', error)
            throw error
        }
    }

    // Create or update today's tracking data
    async updateTodayTrackingData(userId: string, updates: Partial<DailyTrackingData>): Promise<DailyTrackingData> {
        try {
            const today = this.getTodayDateString()
            const trackingRef = doc(db, 'dailyTracking', `${userId}_${today}`)
            const trackingDoc = await getDoc(trackingRef)

            const now = Timestamp.now()

            if (trackingDoc.exists()) {
                // Update existing tracking data
                const updatedData = {
                    ...updates,
                    updatedAt: now
                }
                await updateDoc(trackingRef, updatedData)

                const updatedDoc = await getDoc(trackingRef)
                return updatedDoc.data() as DailyTrackingData
            } else {
                // Create new tracking data for today
                const newTrackingData: DailyTrackingData = {
                    userId,
                    date: today,
                    ...DEFAULT_TRACKING_VALUES,
                    ...updates,
                    createdAt: now,
                    updatedAt: now
                }

                await setDoc(trackingRef, newTrackingData)
                console.log('New daily tracking data created for user:', userId, 'date:', today)
                return newTrackingData
            }
        } catch (error) {
            console.error('Error updating today\'s tracking data:', error)
            throw error
        }
    }

    // Get tracking data for a specific date
    async getTrackingDataByDate(userId: string, date: string): Promise<DailyTrackingData | null> {
        try {
            const trackingRef = doc(db, 'dailyTracking', `${userId}_${date}`)
            const trackingDoc = await getDoc(trackingRef)

            if (trackingDoc.exists()) {
                return trackingDoc.data() as DailyTrackingData
            }

            return null
        } catch (error) {
            console.error('Error getting tracking data by date:', error)
            throw error
        }
    }

    // Get tracking data for a date range
    async getTrackingDataRange(userId: string, startDate: string, endDate: string): Promise<DailyTrackingData[]> {
        try {
            const trackingCollection = collection(db, 'dailyTracking')
            const q = query(
                trackingCollection,
                where('userId', '==', userId),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            )

            const querySnapshot = await getDocs(q)
            const trackingData: DailyTrackingData[] = []

            querySnapshot.forEach((doc) => {
                trackingData.push(doc.data() as DailyTrackingData)
            })

            return trackingData.sort((a, b) => a.date.localeCompare(b.date))
        } catch (error) {
            console.error('Error getting tracking data range:', error)
            throw error
        }
    }

    // Get all tracking data for a user
    async getAllUserTrackingData(userId: string): Promise<DailyTrackingData[]> {
        try {
            const trackingCollection = collection(db, 'dailyTracking')
            const q = query(trackingCollection, where('userId', '==', userId))

            const querySnapshot = await getDocs(q)
            const trackingData: DailyTrackingData[] = []

            querySnapshot.forEach((doc) => {
                trackingData.push(doc.data() as DailyTrackingData)
            })

            return trackingData.sort((a, b) => a.date.localeCompare(b.date))
        } catch (error) {
            console.error('Error getting all user tracking data:', error)
            throw error
        }
    }

    // Log a meal (increment mealsLogged)
    async logMeal(userId: string, calories: number, protein: number, carbs: number, fat: number): Promise<void> {
        try {
            const todayData = await this.getTodayTrackingData(userId)

            const updates = {
                caloriesConsumed: (todayData?.caloriesConsumed || 0) + calories,
                proteinConsumed: (todayData?.proteinConsumed || 0) + protein,
                carbsConsumed: (todayData?.carbsConsumed || 0) + carbs,
                fatConsumed: (todayData?.fatConsumed || 0) + fat,
                mealsLogged: (todayData?.mealsLogged || 0) + 1
            }

            await this.updateTodayTrackingData(userId, updates)
            console.log('Meal logged for user:', userId)
        } catch (error) {
            console.error('Error logging meal:', error)
            throw error
        }
    }

    // Log a snack (increment snacksLogged)
    async logSnack(userId: string, calories: number, protein: number, carbs: number, fat: number): Promise<void> {
        try {
            const todayData = await this.getTodayTrackingData(userId)

            const updates = {
                caloriesConsumed: (todayData?.caloriesConsumed || 0) + calories,
                proteinConsumed: (todayData?.proteinConsumed || 0) + protein,
                carbsConsumed: (todayData?.carbsConsumed || 0) + carbs,
                fatConsumed: (todayData?.fatConsumed || 0) + fat,
                snacksLogged: (todayData?.snacksLogged || 0) + 1
            }

            await this.updateTodayTrackingData(userId, updates)
            console.log('Snack logged for user:', userId)
        } catch (error) {
            console.error('Error logging snack:', error)
            throw error
        }
    }

    // Log water intake
    async logWaterIntake(userId: string, liters: number): Promise<void> {
        try {
            const todayData = await this.getTodayTrackingData(userId)

            const updates = {
                waterIntake: (todayData?.waterIntake || 0) + liters
            }

            await this.updateTodayTrackingData(userId, updates)
            console.log('Water intake logged for user:', userId)
        } catch (error) {
            console.error('Error logging water intake:', error)
            throw error
        }
    }

    // Log exercise
    async logExercise(userId: string, minutes: number, caloriesBurned: number): Promise<void> {
        try {
            const todayData = await this.getTodayTrackingData(userId)

            const updates = {
                exerciseMinutes: (todayData?.exerciseMinutes || 0) + minutes,
                caloriesBurned: (todayData?.caloriesBurned || 0) + caloriesBurned
            }

            await this.updateTodayTrackingData(userId, updates)
            console.log('Exercise logged for user:', userId)
        } catch (error) {
            console.error('Error logging exercise:', error)
            throw error
        }
    }

    // Update weight
    async updateWeight(userId: string, weight: number): Promise<void> {
        try {
            await this.updateTodayTrackingData(userId, { weight })
            console.log('Weight updated for user:', userId)
        } catch (error) {
            console.error('Error updating weight:', error)
            throw error
        }
    }

    // Update mood
    async updateMood(userId: string, mood: number): Promise<void> {
        try {
            if (mood < 1 || mood > 10) {
                throw new Error('Mood must be between 1 and 10')
            }

            await this.updateTodayTrackingData(userId, { mood })
            console.log('Mood updated for user:', userId)
        } catch (error) {
            console.error('Error updating mood:', error)
            throw error
        }
    }

    // Update sleep hours
    async updateSleepHours(userId: string, hours: number): Promise<void> {
        try {
            await this.updateTodayTrackingData(userId, { sleepHours: hours })
            console.log('Sleep hours updated for user:', userId)
        } catch (error) {
            console.error('Error updating sleep hours:', error)
            throw error
        }
    }

    // User Preferences Methods
    async initializeUserPreferences(userId: string, preferences?: Partial<UserPreferences>): Promise<UserPreferences> {
        try {
            const userPrefsRef = doc(db, 'userPreferences', userId)
            const userPrefsDoc = await getDoc(userPrefsRef)

            if (!userPrefsDoc.exists()) {
                // Create default preferences for new user
                const defaultPreferences: UserPreferences = {
                    userId,
                    preferredMealTimes: {
                        breakfast: '08:00',
                        lunch: '12:00',
                        dinner: '18:00'
                    },
                    dietaryRestrictions: [],
                    allergies: [],
                    favoriteFoods: [],
                    dislikedFoods: [],
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    ...preferences
                }

                await setDoc(userPrefsRef, defaultPreferences)
                console.log('User preferences created for user:', userId)
                return defaultPreferences
            }

            return userPrefsDoc.data() as UserPreferences
        } catch (error) {
            console.error('Error initializing user preferences:', error)
            throw error
        }
    }

    async getUserPreferences(userId: string): Promise<UserPreferences | null> {
        try {
            const userPrefsRef = doc(db, 'userPreferences', userId)
            const userPrefsDoc = await getDoc(userPrefsRef)

            if (userPrefsDoc.exists()) {
                return userPrefsDoc.data() as UserPreferences
            }

            return null
        } catch (error) {
            console.error('Error getting user preferences:', error)
            throw error
        }
    }

    async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
        try {
            const userPrefsRef = doc(db, 'userPreferences', userId)
            await updateDoc(userPrefsRef, {
                ...updates,
                updatedAt: Timestamp.now()
            })
            console.log('User preferences updated for user:', userId)
        } catch (error) {
            console.error('Error updating user preferences:', error)
            throw error
        }
    }

    // Food Logging Methods
    async logFoodItem(
        userId: string,
        foodName: string,
        calories: number,
        protein: number,
        carbs: number,
        fat: number,
        servingSize: string,
        mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    ): Promise<string> {
        try {
            const today = this.getTodayDateString()
            const now = Timestamp.now()

            // Create food log entry
            const foodLogEntry: Omit<FoodLogEntry, 'id'> = {
                userId,
                date: today,
                foodName,
                calories,
                protein,
                carbs,
                fat,
                servingSize,
                mealType,
                timestamp: now,
                createdAt: now
            }

            // Add to foodLogs collection
            const foodLogsRef = collection(db, 'foodLogs')
            const docRef = await addDoc(foodLogsRef, foodLogEntry)

            // Update daily tracking data
            const todayData = await this.getTodayTrackingData(userId)
            const updates = {
                caloriesConsumed: (todayData?.caloriesConsumed || 0) + calories,
                proteinConsumed: (todayData?.proteinConsumed || 0) + protein,
                carbsConsumed: (todayData?.carbsConsumed || 0) + carbs,
                fatConsumed: (todayData?.fatConsumed || 0) + fat,
                mealsLogged: mealType === 'snack' ?
                    (todayData?.snacksLogged || 0) + 1 :
                    (todayData?.mealsLogged || 0) + 1
            }

            await this.updateTodayTrackingData(userId, updates)
            console.log('Food item logged for user:', userId, 'food:', foodName)
            return docRef.id
        } catch (error) {
            console.error('Error logging food item:', error)
            throw error
        }
    }

    async getFoodLogsByDate(userId: string, date: string): Promise<FoodLogEntry[]> {
        try {
            const foodLogsRef = collection(db, 'foodLogs')
            const q = query(
                foodLogsRef,
                where('userId', '==', userId),
                where('date', '==', date),
                orderBy('timestamp', 'desc')
            )

            const querySnapshot = await getDocs(q)
            const foodLogs: FoodLogEntry[] = []

            querySnapshot.forEach((doc) => {
                foodLogs.push({
                    id: doc.id,
                    ...doc.data()
                } as FoodLogEntry)
            })

            return foodLogs
        } catch (error) {
            console.error('Error getting food logs by date:', error)
            throw error
        }
    }

    async getFoodLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<FoodLogEntry[]> {
        try {
            const foodLogsRef = collection(db, 'foodLogs')
            const q = query(
                foodLogsRef,
                where('userId', '==', userId),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date', 'desc'),
                orderBy('timestamp', 'desc')
            )

            const querySnapshot = await getDocs(q)
            const foodLogs: FoodLogEntry[] = []

            querySnapshot.forEach((doc) => {
                foodLogs.push({
                    id: doc.id,
                    ...doc.data()
                } as FoodLogEntry)
            })

            return foodLogs
        } catch (error) {
            console.error('Error getting food logs by date range:', error)
            throw error
        }
    }

    async getAllUserFoodLogs(userId: string): Promise<FoodLogEntry[]> {
        try {
            const foodLogsRef = collection(db, 'foodLogs')
            const q = query(
                foodLogsRef,
                where('userId', '==', userId),
                orderBy('date', 'desc'),
                orderBy('timestamp', 'desc')
            )

            const querySnapshot = await getDocs(q)
            const foodLogs: FoodLogEntry[] = []

            querySnapshot.forEach((doc) => {
                foodLogs.push({
                    id: doc.id,
                    ...doc.data()
                } as FoodLogEntry)
            })

            return foodLogs
        } catch (error) {
            console.error('Error getting all user food logs:', error)
            throw error
        }
    }

    async deleteFoodLogEntry(foodLogId: string, userId: string): Promise<void> {
        try {
            // Get the food log entry to subtract from daily totals
            const foodLogRef = doc(db, 'foodLogs', foodLogId)
            const foodLogDoc = await getDoc(foodLogRef)

            if (foodLogDoc.exists()) {
                const foodLog = foodLogDoc.data() as FoodLogEntry

                // Delete the food log entry
                await deleteDoc(foodLogRef)

                // Update daily tracking data by subtracting the values
                const todayData = await this.getTodayTrackingData(userId)
                const updates = {
                    caloriesConsumed: Math.max(0, (todayData?.caloriesConsumed || 0) - foodLog.calories),
                    proteinConsumed: Math.max(0, (todayData?.proteinConsumed || 0) - foodLog.protein),
                    carbsConsumed: Math.max(0, (todayData?.carbsConsumed || 0) - foodLog.carbs),
                    fatConsumed: Math.max(0, (todayData?.fatConsumed || 0) - foodLog.fat),
                    mealsLogged: foodLog.mealType === 'snack' ?
                        Math.max(0, (todayData?.snacksLogged || 0) - 1) :
                        Math.max(0, (todayData?.mealsLogged || 0) - 1)
                }

                await this.updateTodayTrackingData(userId, updates)
                console.log('Food log entry deleted:', foodLogId)
            }
        } catch (error) {
            console.error('Error deleting food log entry:', error)
            throw error
        }
    }

    async getFoodLogsByMealType(userId: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', date?: string): Promise<FoodLogEntry[]> {
        try {
            const foodLogsRef = collection(db, 'foodLogs')
            let q = query(
                foodLogsRef,
                where('userId', '==', userId),
                where('mealType', '==', mealType),
                orderBy('timestamp', 'desc')
            )

            if (date) {
                q = query(
                    foodLogsRef,
                    where('userId', '==', userId),
                    where('date', '==', date),
                    where('mealType', '==', mealType),
                    orderBy('timestamp', 'desc')
                )
            }

            const querySnapshot = await getDocs(q)
            const foodLogs: FoodLogEntry[] = []

            querySnapshot.forEach((doc) => {
                foodLogs.push({
                    id: doc.id,
                    ...doc.data()
                } as FoodLogEntry)
            })

            return foodLogs
        } catch (error) {
            console.error('Error getting food logs by meal type:', error)
            throw error
        }
    }
}

// Export singleton instance
export const userTrackingService = new UserTrackingService()
export default userTrackingService
