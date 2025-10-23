import React, { useState } from 'react'
import {
    Bot,
    Sparkles,
    ChefHat,
    Clock,
    Users,
    Star,
    Copy,
    Download,
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
    const [ingredients, setIngredients] = useState('')
    const [dietaryPreferences, setDietaryPreferences] = useState('')
    const [mealType, setMealType] = useState('')
    const [cookingTime, setCookingTime] = useState('')
    const [cuisine, setCuisine] = useState('')
    const [loading, setLoading] = useState(false)
    const [generatedRecipe, setGeneratedRecipe] = useState<AIRecipe | null>(null)
    const [error, setError] = useState('')

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
            console.error('AI recipe generation error:', error)
            setError('Failed to generate recipe. Please try again.')

            // Fallback to mock data for demo purposes
            const mockRecipe: AIRecipe = {
                id: Date.now().toString(),
                title: 'AI-Generated Mediterranean Quinoa Bowl',
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

    const toggleFavorite = () => {
        if (generatedRecipe) {
            setGeneratedRecipe({ ...generatedRecipe, isFavorite: !generatedRecipe.isFavorite })
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            case 'Medium': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
            case 'Hard': return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Bot className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    AI Recipe Generator
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Tell us what ingredients you have, and we'll create a delicious recipe for you!
                </p>
            </div>

            {/* Input Form */}
            <div className="card">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            What ingredients do you have? *
                        </label>
                        <textarea
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            placeholder="e.g., chicken breast, quinoa, spinach, tomatoes, olive oil..."
                            className="input-field min-h-[100px] resize-none"
                            rows={4}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            List the main ingredients you have available
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dietary Preferences
                            </label>
                            <select
                                value={dietaryPreferences}
                                onChange={(e) => setDietaryPreferences(e.target.value)}
                                className="input-field"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Meal Type
                            </label>
                            <select
                                value={mealType}
                                onChange={(e) => setMealType(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Any meal</option>
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                                <option value="dessert">Dessert</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cooking Time
                            </label>
                            <select
                                value={cookingTime}
                                onChange={(e) => setCookingTime(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Any time</option>
                                <option value="15">15 minutes or less</option>
                                <option value="30">30 minutes or less</option>
                                <option value="45">45 minutes or less</option>
                                <option value="60">1 hour or less</option>
                                <option value="90">1.5 hours or less</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cuisine Style
                            </label>
                            <select
                                value={cuisine}
                                onChange={(e) => setCuisine(e.target.value)}
                                className="input-field"
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

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={generateRecipe}
                        disabled={loading || !ingredients.trim()}
                        className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5" />
                        )}
                        <span>{loading ? 'Generating Recipe...' : 'Generate Recipe'}</span>
                    </button>
                </div>
            </div>

            {/* Generated Recipe */}
            {generatedRecipe && (
                <div className="card">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {generatedRecipe.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {generatedRecipe.description}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={toggleFavorite}
                                className={`p-2 rounded-lg transition-colors ${generatedRecipe.isFavorite
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 ${generatedRecipe.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={copyRecipe}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Recipe Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {generatedRecipe.prepTime} min
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Prep</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <ChefHat className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {generatedRecipe.cookTime} min
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Cook</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {generatedRecipe.servings}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Servings</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Star className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {generatedRecipe.difficulty}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
                        </div>
                    </div>

                    {/* Nutrition Info */}
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Nutrition (per serving)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{generatedRecipe.calories}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{generatedRecipe.protein}g</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Protein</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{generatedRecipe.carbs}g</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Carbs</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{generatedRecipe.fat}g</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Fat</p>
                            </div>
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
                                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {ingredient.amount} {ingredient.unit}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {ingredient.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Instructions</h3>
                        <div className="space-y-3">
                            {generatedRecipe.instructions.map((instruction, index) => (
                                <div key={index} className="flex space-x-3">
                                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{instruction}</p>
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
                <div className="text-center">
                    <button
                        onClick={() => {
                            setGeneratedRecipe(null)
                            setIngredients('')
                            setDietaryPreferences('')
                            setMealType('')
                            setCookingTime('')
                            setCuisine('')
                        }}
                        className="btn-secondary flex items-center space-x-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Generate Another Recipe</span>
                    </button>
                </div>
            )}
        </div>
    )
}
