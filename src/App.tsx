import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'

// Pages
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { MealLogger } from './pages/MealLogger'
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
                                <Route path="/" element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } />
                                <Route path="/meals" element={
                                    <ProtectedRoute>
                                        <MealLogger />
                                    </ProtectedRoute>
                                } />
                                <Route path="/recipes" element={
                                    <ProtectedRoute>
                                        <RecipeSearch />
                                    </ProtectedRoute>
                                } />
                                <Route path="/ai-recipes" element={
                                    <ProtectedRoute>
                                        <AIRecipeGenerator />
                                    </ProtectedRoute>
                                } />
                                <Route path="/goals" element={
                                    <ProtectedRoute>
                                        <GoalTracker />
                                    </ProtectedRoute>
                                } />
                                <Route path="/faq" element={<FAQ />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
