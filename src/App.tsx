import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'

// Pages
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { Dashboard } from './pages/Dashboard'
import { RecipeSearch } from './pages/RecipeSearch'
import { GoalTracker } from './pages/GoalTracker'
import { AIRecipeGenerator } from './pages/AIRecipeGenerator'
import { FAQ } from './pages/FAQ'

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                        <Navbar />
                        <main className="container mx-auto px-4 py-8">
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/onboarding" element={
                                    <ProtectedRoute>
                                        <OnboardingPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/" element={
                                    <ProtectedRoute requireOnboarding={true}>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } />
                                <Route path="/recipes" element={
                                    <ProtectedRoute requireOnboarding={true}>
                                        <RecipeSearch />
                                    </ProtectedRoute>
                                } />
                                <Route path="/ai-recipes" element={
                                    <ProtectedRoute requireOnboarding={true}>
                                        <AIRecipeGenerator />
                                    </ProtectedRoute>
                                } />
                                <Route path="/goals" element={
                                    <ProtectedRoute requireOnboarding={true}>
                                        <GoalTracker />
                                    </ProtectedRoute>
                                } />
                                <Route path="/faq" element={<FAQ />} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
