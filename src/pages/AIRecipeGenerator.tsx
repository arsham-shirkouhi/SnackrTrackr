import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { userTrackingService } from '../services/userTrackingService'
import {
    ChefHat,
    Sparkles,
    Copy,
    Heart,
    RefreshCw,
    Loader2
} from 'lucide-react'

interface AIRecipe {
    id: string
    title: string
    description: string
    prepTime: number
    cookTime: number
    servings: number
    difficulty: 'Easy' | 'Medium' | 'Hard'
    calories: number
    protein: number
    carbs: number
    fat: number
    ingredients: {
        name: string
        amount: string
        unit: string
    }[]
    instructions: string[]
    tags: string[]
    tips: string[]
    isFavorite: boolean
}

export const AIRecipeGenerator: React.FC = () => {
    const { user } = useAuth()
    const [ingredients, setIngredients] = useState('')
    const [dietaryPreferences, setDietaryPreferences] = useState('')
    const [mealType, setMealType] = useState('')
    const [cookingTime, setCookingTime] = useState('')
    const [cuisine, setCuisine] = useState('')
    const [loading, setLoading] = useState(false)
    const [generatedRecipe, setGeneratedRecipe] = useState<AIRecipe | null>(null)
    const [error, setError] = useState('')
    const [favoriteId, setFavoriteId] = useState<string | null>(null)

    const generateRecipe = async () => {
        if (!ingredients.trim()) {
            setError('Please enter at least one ingredient')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Call the backend API for AI recipe generation
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/ai-recipes/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients,
                    dietaryPreferences,
                    mealType,
                    cookingTime,
                    cuisine
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const recipe = await response.json()
            setGeneratedRecipe(recipe)

        } catch (error) {
            console.error('Recipe generation error:', error)
            setError('Failed to generate recipe. Please try again.')

            // Fallback to mock data for demo purposes
            const mockRecipe: AIRecipe = {
                id: Date.now().toString(),
                title: 'Mediterranean Quinoa Bowl',
                description: 'A nutritious and flavorful quinoa bowl featuring the ingredients you provided, enhanced with Mediterranean flavors and fresh vegetables.',
                prepTime: 15,
                cookTime: 20,
                servings: 4,
                difficulty: 'Easy',
                calories: 385,
                protein: 18,
                carbs: 45,
                fat: 12,
                ingredients: [
                    { name: 'Quinoa', amount: '1', unit: 'cup' },
                    { name: 'Cherry tomatoes', amount: '1', unit: 'cup' },
                    { name: 'Cucumber', amount: '1', unit: 'medium' },
                    { name: 'Red bell pepper', amount: '1', unit: 'medium' },
                    { name: 'Red onion', amount: '1/2', unit: 'medium' },
                    { name: 'Kalamata olives', amount: '1/2', unit: 'cup' },
                    { name: 'Feta cheese', amount: '1/2', unit: 'cup' },
                    { name: 'Fresh parsley', amount: '1/4', unit: 'cup' },
                    { name: 'Olive oil', amount: '3', unit: 'tbsp' },
                    { name: 'Lemon juice', amount: '2', unit: 'tbsp' },
                    { name: 'Salt', amount: '1', unit: 'tsp' },
                    { name: 'Black pepper', amount: '1/2', unit: 'tsp' }
                ],
                instructions: [
                    'Rinse the quinoa under cold water until the water runs clear.',
                    'In a medium saucepan, bring 2 cups of water to a boil. Add quinoa, reduce heat to low, cover, and simmer for 15 minutes.',
                    'Remove from heat and let stand covered for 5 minutes. Fluff with a fork and let cool.',
                    'Meanwhile, dice the cucumber and red bell pepper into small cubes.',
                    'Slice the red onion thinly and halve the cherry tomatoes.',
                    'In a large bowl, combine the cooled quinoa with all the vegetables.',
                    'Add the kalamata olives and crumbled feta cheese.',
                    'In a small bowl, whisk together olive oil, lemon juice, salt, and black pepper.',
                    'Pour the dressing over the quinoa mixture and toss gently to combine.',
                    'Garnish with fresh parsley and serve immediately or refrigerate for up to 3 days.'
                ],
                tags: ['Mediterranean', 'Healthy', 'Vegetarian', 'Gluten-Free'],
                tips: [
                    'For best flavor, let the salad sit for 30 minutes before serving to allow flavors to meld.',
                    'You can add grilled chicken or shrimp for extra protein.',
                    'Store leftovers in an airtight container in the refrigerator.'
                ],
                isFavorite: false
            }

            setGeneratedRecipe(mockRecipe)
        } finally {
            setLoading(false)
        }
    }

    const copyRecipe = () => {
        if (!generatedRecipe) return

        const recipeText = `
${generatedRecipe.title}

${generatedRecipe.description}

Prep Time: ${generatedRecipe.prepTime} minutes
Cook Time: ${generatedRecipe.cookTime} minutes
Servings: ${generatedRecipe.servings}
Difficulty: ${generatedRecipe.difficulty}

Nutrition (per serving):
- Calories: ${generatedRecipe.calories}
- Protein: ${generatedRecipe.protein}g
- Carbs: ${generatedRecipe.carbs}g
- Fat: ${generatedRecipe.fat}g

Ingredients:
${generatedRecipe.ingredients.map(ing => `- ${ing.amount} ${ing.unit} ${ing.name}`).join('\n')}

Instructions:
${generatedRecipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Tips:
${generatedRecipe.tips.map(tip => `- ${tip}`).join('\n')}
    `.trim()

        navigator.clipboard.writeText(recipeText)
    }

    // Check if recipe is favorite when it's generated
    useEffect(() => {
        let isMounted = true
        const checkFavorite = async () => {
            if (generatedRecipe && user) {
                try {
                    const isFav = await userTrackingService.isRecipeFavorite(user.uid, generatedRecipe.title)
                    // Only update state if component is still mounted and recipe hasn't changed
                    if (isMounted && isFav) {
                        // Find the favorite ID
                        const favorites = await userTrackingService.getFavoriteRecipes(user.uid)
                        const favorite = favorites.find(f => f.title === generatedRecipe.title)
                        if (favorite && isMounted) {
                            setFavoriteId(favorite.id)
                            // Use functional update to avoid stale closure issues
                            setGeneratedRecipe(prev => prev ? { ...prev, isFavorite: true } : null)
                        }
                    }
                } catch (error) {
                    // Silently fail - user might not have permissions set up yet
                    console.warn('Could not check favorite status:', error)
                }
            }
        }
        checkFavorite()

        // Cleanup function to prevent state updates after unmount or recipe change
        return () => {
            isMounted = false
        }
    }, [generatedRecipe?.id, user])

    const toggleFavorite = async () => {
        if (!generatedRecipe || !user) return

        const newFavoriteState = !generatedRecipe.isFavorite

        try {
            if (newFavoriteState) {
                // Save to favorites
                const favoriteId = await userTrackingService.saveFavoriteRecipe(user.uid, {
                    title: generatedRecipe.title,
                    description: generatedRecipe.description,
                    prepTime: generatedRecipe.prepTime,
                    cookTime: generatedRecipe.cookTime,
                    servings: generatedRecipe.servings,
                    difficulty: generatedRecipe.difficulty,
                    calories: generatedRecipe.calories,
                    protein: generatedRecipe.protein,
                    carbs: generatedRecipe.carbs,
                    fat: generatedRecipe.fat,
                    ingredients: generatedRecipe.ingredients,
                    instructions: generatedRecipe.instructions,
                    tags: generatedRecipe.tags,
                    tips: generatedRecipe.tips
                })
                setFavoriteId(favoriteId)
                setGeneratedRecipe({ ...generatedRecipe, isFavorite: true })
            } else {
                // Remove from favorites
                if (favoriteId) {
                    await userTrackingService.deleteFavoriteRecipe(favoriteId)
                    setFavoriteId(null)
                } else {
                    // Find and delete by title if ID not found
                    const favorites = await userTrackingService.getFavoriteRecipes(user.uid)
                    const favorite = favorites.find(f => f.title === generatedRecipe.title)
                    if (favorite) {
                        await userTrackingService.deleteFavoriteRecipe(favorite.id)
                    }
                }
                setGeneratedRecipe({ ...generatedRecipe, isFavorite: false })
            }
        } catch (error: any) {
            console.error('Error toggling favorite:', error)
            if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
                setError('Permission denied. Please make sure you are logged in and Firestore rules are deployed.')
            } else {
                setError('Failed to update favorite. Please try again.')
            }
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn" key={generatedRecipe ? 'recipe-view' : 'input-view'}>
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    What's in your fridge?
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Tell us what ingredients you have and we'll create a delicious recipe just for you
                </p>
            </div>

            {/* Input Form - Hide when recipe is generated */}
            {!generatedRecipe && (
                <div className="space-y-6">
                    {/* Ingredients Section */}
                    <div className="space-y-3 animate-slideUp">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                            <span>What ingredients do you have?</span>
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            placeholder="e.g., chicken breast, quinoa, spinach, tomatoes, olive oil..."
                            className="input-field min-h-[140px] resize-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 hover:shadow-md"
                            rows={4}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                            <span>List the main ingredients you have available</span>
                        </p>
                    </div>

                    {/* Preferences Grid */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 animate-slideUp">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                            <span>Recipe Preferences</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Dietary Preferences
                                </label>
                                <select
                                    value={dietaryPreferences}
                                    onChange={(e) => setDietaryPreferences(e.target.value)}
                                    className="input-field focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                                >
                                    <option value="">No restrictions</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="keto">Keto</option>
                                    <option value="paleo">Paleo</option>
                                    <option value="gluten-free">Gluten-Free</option>
                                    <option value="dairy-free">Dairy-Free</option>
                                </select>
                            </div>

                            <div className="space-y-2 group">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Meal Type
                                </label>
                                <select
                                    value={mealType}
                                    onChange={(e) => setMealType(e.target.value)}
                                    className="input-field focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                                >
                                    <option value="">Any meal</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                    <option value="dessert">Dessert</option>
                                </select>
                            </div>

                            <div className="space-y-2 group">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Cooking Time
                                </label>
                                <select
                                    value={cookingTime}
                                    onChange={(e) => setCookingTime(e.target.value)}
                                    className="input-field focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                                >
                                    <option value="">Any time</option>
                                    <option value="15">15 minutes or less</option>
                                    <option value="30">30 minutes or less</option>
                                    <option value="45">45 minutes or less</option>
                                    <option value="60">1 hour or less</option>
                                    <option value="90">1.5 hours or less</option>
                                </select>
                            </div>

                            <div className="space-y-2 group">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Cuisine Style
                                </label>
                                <select
                                    value={cuisine}
                                    onChange={(e) => setCuisine(e.target.value)}
                                    className="input-field focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                                >
                                    <option value="">Any cuisine</option>
                                    <option value="mediterranean">Mediterranean</option>
                                    <option value="asian">Asian</option>
                                    <option value="italian">Italian</option>
                                    <option value="mexican">Mexican</option>
                                    <option value="indian">Indian</option>
                                    <option value="american">American</option>
                                    <option value="french">French</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 animate-slideUp">
                        <button
                            onClick={generateRecipe}
                            disabled={loading || !ingredients.trim()}
                            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating Recipe...</span>
                                </>
                            ) : (
                                <>
                                    <ChefHat className="w-5 h-5" />
                                    <span>Create Recipe</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Generated Recipe */}
            {generatedRecipe && (
                <div className="card transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {generatedRecipe.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {generatedRecipe.description}
                            </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                            <button
                                onClick={toggleFavorite}
                                className={`p-2 rounded-lg transition-colors ${generatedRecipe.isFavorite
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                    }`}
                                title={generatedRecipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <Heart className={`w-5 h-5 ${generatedRecipe.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={copyRecipe}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                title="Copy recipe"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Recipe Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-3 bg-gray-700 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-bold text-white">
                                {generatedRecipe.prepTime} min
                            </p>
                            <p className="text-xs text-gray-400">Prep</p>
                        </div>
                        <div className="p-3 bg-gray-700 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-bold text-white">
                                {generatedRecipe.cookTime} min
                            </p>
                            <p className="text-xs text-gray-400">Cook</p>
                        </div>
                        <div className="p-3 bg-gray-700 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-bold text-white">
                                {generatedRecipe.servings}
                            </p>
                            <p className="text-xs text-gray-400">Servings</p>
                        </div>
                        <div className="p-3 bg-gray-700 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-bold text-white">
                                {generatedRecipe.difficulty}
                            </p>
                            <p className="text-xs text-gray-400">Level</p>
                        </div>
                    </div>

                    {/* Nutrition Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/50">
                            <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                                <span className="text-sm text-blue-600 dark:text-blue-400">Calories</span>
                                <span className="text-blue-600 dark:text-blue-400">{generatedRecipe.calories}</span>
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/50">
                            <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                                <span className="text-sm text-red-600 dark:text-red-400">Protein</span>
                                <span className="text-red-600 dark:text-red-400">{generatedRecipe.protein}g</span>
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-200 dark:hover:shadow-green-900/50">
                            <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                                <span className="text-sm text-green-600 dark:text-green-400">Carbs</span>
                                <span className="text-green-600 dark:text-green-400">{generatedRecipe.carbs}g</span>
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-200 dark:hover:shadow-yellow-900/50">
                            <p className="text-lg font-bold leading-tight flex justify-between items-center w-full">
                                <span className="text-sm text-yellow-600 dark:text-yellow-400">Fat</span>
                                <span className="text-yellow-600 dark:text-yellow-400">{generatedRecipe.fat}g</span>
                            </p>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {generatedRecipe.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Ingredients</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {generatedRecipe.ingredients.map((ingredient, index) => (
                                <div key={index} className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary-300 dark:hover:border-primary-600">
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {ingredient.amount} {ingredient.unit}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {ingredient.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Instructions</h3>
                        <div className="space-y-3">
                            {generatedRecipe.instructions.map((instruction, index) => (
                                <div key={index} className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary-300 dark:hover:border-primary-600">
                                    <div className="flex space-x-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">{instruction}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Chef's Tips</h3>
                        <div className="space-y-2">
                            {generatedRecipe.tips.map((tip, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Another Recipe */}
            {generatedRecipe && (
                <div className="text-center pt-4">
                    <button
                        onClick={() => {
                            // Clear the recipe first to hide it immediately
                            setGeneratedRecipe(null)
                            // Clear all form state
                            setIngredients('')
                            setDietaryPreferences('')
                            setMealType('')
                            setCookingTime('')
                            setCuisine('')
                            setError('')
                            setFavoriteId(null)
                            // Scroll to top to show the input form
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }, 100)
                        }}
                        className="btn-secondary flex items-center space-x-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Create Another Recipe</span>
                    </button>
                </div>
            )}
        </div>
    )
}
