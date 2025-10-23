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

interface UserProfile {
    email: string
    weight: number
    height: number
    age: number
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
    goals: {
        dailyCalories: number
        protein: number
        carbs: number
        fat: number
    }
    savedRecipes: string[]
    createdAt: Date
}

interface AuthContextType {
    user: User | null
    userProfile: UserProfile | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<void>
    logout: () => Promise<void>
    updateProfile: (profile: Partial<UserProfile>) => Promise<void>
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
                    } else {
                        // If user document doesn't exist, create it
                        console.log('User document not found, creating default profile...')
                        const defaultProfile: UserProfile = {
                            email: user.email || '',
                            weight: 70,
                            height: 170,
                            age: 25,
                            activityLevel: 'moderate',
                            goals: {
                                dailyCalories: 2000,
                                protein: 150,
                                carbs: 250,
                                fat: 67
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
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error)
                    // Create a default profile if there's an error
                    const defaultProfile: UserProfile = {
                        email: user.email || '',
                        weight: 70,
                        height: 170,
                        age: 25,
                        activityLevel: 'moderate',
                        goals: {
                            dailyCalories: 2000,
                            protein: 150,
                            carbs: 250,
                            fat: 67
                        },
                        savedRecipes: [],
                        createdAt: new Date()
                    }
                    setUserProfile(defaultProfile)
                }
            } else {
                setUserProfile(null)
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

    const signUp = async (email: string, password: string, profile: Partial<UserProfile>) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Create user profile in Firestore
            const userProfile: UserProfile = {
                email,
                weight: profile.weight || 70,
                height: profile.height || 170,
                age: profile.age || 25,
                activityLevel: profile.activityLevel || 'moderate',
                goals: profile.goals || {
                    dailyCalories: 2000,
                    protein: 150,
                    carbs: 250,
                    fat: 67
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

    const value = {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        logout,
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
