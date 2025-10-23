import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import { AuthProvider } from '../../context/AuthContext'
import { ThemeProvider } from '../../context/ThemeContext'

// Mock the auth context
const mockAuthContext = {
    user: null,
    userProfile: null,
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

describe('Navbar', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the logo and brand name', () => {
        renderWithProviders(<Navbar />)

        expect(screen.getByText('SnackrTrackr')).toBeInTheDocument()
    })

    it('shows login button when user is not authenticated', () => {
        renderWithProviders(<Navbar />)

        expect(screen.getByText('Login')).toBeInTheDocument()
    })

    it('shows user email when user is authenticated', () => {
        mockAuthContext.user = { email: 'test@example.com' } as any

        renderWithProviders(<Navbar />)

        expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('renders navigation links', () => {
        renderWithProviders(<Navbar />)

        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Meals')).toBeInTheDocument()
        expect(screen.getByText('Recipes')).toBeInTheDocument()
        expect(screen.getByText('AI Recipes')).toBeInTheDocument()
        expect(screen.getByText('Goals')).toBeInTheDocument()
    })

    it('toggles mobile menu when menu button is clicked', () => {
        renderWithProviders(<Navbar />)

        const menuButton = screen.getByRole('button', { name: /menu/i })
        fireEvent.click(menuButton)

        // Mobile menu should be visible
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('calls logout when logout button is clicked', () => {
        mockAuthContext.user = { email: 'test@example.com' } as any

        renderWithProviders(<Navbar />)

        const logoutButton = screen.getByText('Logout')
        fireEvent.click(logoutButton)

        expect(mockAuthContext.logout).toHaveBeenCalled()
    })
})
