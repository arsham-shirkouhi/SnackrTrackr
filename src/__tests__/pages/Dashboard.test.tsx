import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Dashboard } from '../../pages/Dashboard'
import { AuthProvider } from '../../context/AuthContext'
import { ThemeProvider } from '../../context/ThemeContext'

// Mock the auth context
const mockAuthContext = {
    user: { email: 'test@example.com' },
    userProfile: {
        email: 'test@example.com',
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
    },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
}

jest.mock('../../context/AuthContext', () => ({
    useAuth: () => mockAuthContext,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({
        isDark: false,
        toggleTheme: jest.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    {component}
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}

describe('Dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the dashboard header with greeting', () => {
        renderWithProviders(<Dashboard />)

        expect(screen.getByText(/Good morning|Good afternoon|Good evening/)).toBeInTheDocument()
        expect(screen.getByText('test!')).toBeInTheDocument()
    })

    it('displays daily summary cards', () => {
        renderWithProviders(<Dashboard />)

        expect(screen.getByText('Calories')).toBeInTheDocument()
        expect(screen.getByText('Protein')).toBeInTheDocument()
        expect(screen.getByText('Meals')).toBeInTheDocument()
        expect(screen.getByText('Streak')).toBeInTheDocument()
    })

    it('shows progress bars for nutrition goals', () => {
        renderWithProviders(<Dashboard />)

        expect(screen.getByText(/1950/)).toBeInTheDocument()
        expect(screen.getByText(/130g/)).toBeInTheDocument()
    })

    it('displays weekly calorie trend chart', () => {
        renderWithProviders(<Dashboard />)

        expect(screen.getByText('Weekly Calorie Trend')).toBeInTheDocument()
    })

    it('displays macro distribution chart', () => {
        renderWithProviders(<Dashboard />)

        expect(screen.getByText("Today's Macro Distribution")).toBeInTheDocument()
    })

    it('shows recent activity section', () => {
        renderWithProviders(<Dashboard />)

        expect(screen.getByText('Recent Activity')).toBeInTheDocument()
        expect(screen.getByText(/Logged breakfast/)).toBeInTheDocument()
    })

    it('displays current date', () => {
        renderWithProviders(<Dashboard />)

        const today = new Date()
        const expectedDate = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
})
