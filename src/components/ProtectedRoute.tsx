import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireOnboarding?: boolean // If true, redirect to onboarding if not completed
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireOnboarding = false }) => {
    const { user, userProfile, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    <span className="text-gray-600 dark:text-gray-300">Loading...</span>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check if onboarding is required and not completed
    if (requireOnboarding && userProfile && !userProfile.onboardingCompleted) {
        // Don't redirect if already on onboarding page
        if (location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />
        }
    }

    // If onboarding is completed, redirect away from onboarding page
    if (location.pathname === '/onboarding' && userProfile?.onboardingCompleted) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
