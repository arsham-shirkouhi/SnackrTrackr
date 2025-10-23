import React, { useState, useEffect } from 'react'
import {
    Search,
    Filter,
    Clock,
    Users,
    Star,
    Heart,
    BookOpen,
    ChefHat,
    Flame,
    Target,
    Zap,
    Apple
} from 'lucide-react'

interface Recipe {
    id: string
    title: string
    image: string
    readyInMinutes: number
    servings: number
    calories: number
    protein: number
    carbs: number
    fat: number
    healthScore: number
    cuisines: string[]
    dishTypes: string[]
    summary: string
    ingredients: string[]
    instructions: string[]
    isFavorite: boolean
}

export const RecipeSearch: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFilters, setSelectedFilters] = useState({
        cuisine: '',
        diet: '',
        mealType: '',
        maxReadyTime: '',
        healthScore: ''
    })
    const [showFilters, setShowFilters] = useState(false)

    // Mock recipes data
    useEffect(() => {
        const mockRecipes: Recipe[] = [
            {
                id: '1',
                title: 'Mediterranean Quinoa Bowl',
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
                readyInMinutes: 25,
                servings: 2,
                calories: 420,
                protein: 18,
                carbs: 55,
                fat: 12,
                healthScore: 8.5,
                cuisines: ['Mediterranean'],
                dishTypes: ['lunch', 'dinner'],
                summary: 'A nutritious and colorful quinoa bowl with fresh vegetables and Mediterranean flavors.',
                ingredients: [
                    '1 cup quinoa',
                    '2 cups vegetable broth',
                    '1 cucumber, diced',
                    '1 cup cherry tomatoes, halved',
                    '1/2 red onion, sliced',
                    '1/2 cup kalamata olives',
                    '1/4 cup feta cheese',
                    '2 tbsp olive oil',
                    '1 tbsp lemon juice',
                    'Salt and pepper to taste'
                ],
                instructions: [
                    'Cook quinoa according to package directions using vegetable broth.',
                    'Let quinoa cool to room temperature.',
                    'In a large bowl, combine quinoa with cucumber, tomatoes, onion, and olives.',
                    'Drizzle with olive oil and lemon juice.',
                    'Season with salt and pepper.',
                    'Top with feta cheese and serve.'
                ],
                isFavorite: false
            },
            {
                id: '2',
                title: 'High-Protein Chicken Stir-Fry',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
                readyInMinutes: 20,
                servings: 4,
                calories: 320,
                protein: 35,
                carbs: 15,
                fat: 12,
                healthScore: 9.2,
                cuisines: ['Asian'],
                dishTypes: ['lunch', 'dinner'],
                summary: 'Quick and healthy chicken stir-fry packed with protein and vegetables.',
                ingredients: [
                    '1 lb chicken breast, sliced',
                    '2 bell peppers, sliced',
                    '1 broccoli head, cut into florets',
                    '2 carrots, sliced',
                    '3 cloves garlic, minced',
                    '1 inch ginger, grated',
                    '3 tbsp soy sauce',
                    '2 tbsp sesame oil',
                    '1 tbsp cornstarch',
                    'Green onions for garnish'
                ],
                instructions: [
                    'Heat sesame oil in a large wok or skillet over high heat.',
                    'Add chicken and cook until golden brown, about 5 minutes.',
                    'Add garlic and ginger, cook for 1 minute.',
                    'Add vegetables and stir-fry for 3-4 minutes.',
                    'Mix soy sauce with cornstarch and add to pan.',
                    'Cook until sauce thickens, about 2 minutes.',
                    'Garnish with green onions and serve.'
                ],
                isFavorite: true
            },
            {
                id: '3',
                title: 'Vegan Buddha Bowl',
                image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
                readyInMinutes: 30,
                servings: 2,
                calories: 380,
                protein: 15,
                carbs: 45,
                fat: 18,
                healthScore: 9.8,
                cuisines: ['Vegan'],
                dishTypes: ['lunch', 'dinner'],
                summary: 'A colorful and nutritious vegan bowl with roasted vegetables and tahini dressing.',
                ingredients: [
                    '1 sweet potato, cubed',
                    '1 cup chickpeas',
                    '1 cup broccoli florets',
                    '1 avocado, sliced',
                    '1/2 cup quinoa',
                    '2 tbsp tahini',
                    '1 tbsp lemon juice',
                    '1 tbsp maple syrup',
                    'Salt and pepper to taste',
                    'Pumpkin seeds for garnish'
                ],
                instructions: [
                    'Preheat oven to 400°F (200°C).',
                    'Toss sweet potato and broccoli with olive oil, salt, and pepper.',
                    'Roast vegetables for 20-25 minutes until tender.',
                    'Cook quinoa according to package directions.',
                    'Make tahini dressing by whisking tahini, lemon juice, and maple syrup.',
                    'Assemble bowls with quinoa, roasted vegetables, chickpeas, and avocado.',
                    'Drizzle with tahini dressing and garnish with pumpkin seeds.'
                ],
                isFavorite: false
            }
        ]
        setRecipes(mockRecipes)
    }, [])

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        setLoading(true)
        // In a real app, this would make an API call to Spoonacular/Edamam
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }

    const toggleFavorite = (recipeId: string) => {
        setRecipes(recipes.map(recipe =>
            recipe.id === recipeId
                ? { ...recipe, isFavorite: !recipe.isFavorite }
                : recipe
        ))
    }

    const getHealthScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600 bg-green-100 dark:bg-green-900/20'
        if (score >= 6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
    }

    const getCuisineColor = (cuisine: string) => {
        const colors = {
            'Mediterranean': 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            'Asian': 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
            'Vegan': 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
            'Italian': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
        }
        return colors[cuisine as keyof typeof colors] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Recipe Search
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Discover healthy recipes tailored to your nutrition goals
                </p>
            </div>

            {/* Search and Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Search className="w-4 h-4" />
                            <span>{loading ? 'Searching...' : 'Search'}</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Cuisine
                                </label>
                                <select
                                    value={selectedFilters.cuisine}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, cuisine: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Cuisine</option>
                                    <option value="Mediterranean">Mediterranean</option>
                                    <option value="Asian">Asian</option>
                                    <option value="Italian">Italian</option>
                                    <option value="Mexican">Mexican</option>
                                    <option value="Indian">Indian</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Diet
                                </label>
                                <select
                                    value={selectedFilters.diet}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, diet: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Diet</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="keto">Keto</option>
                                    <option value="paleo">Paleo</option>
                                    <option value="low-carb">Low Carb</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Meal Type
                                </label>
                                <select
                                    value={selectedFilters.mealType}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, mealType: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Meal</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Max Ready Time (min)
                                </label>
                                <select
                                    value={selectedFilters.maxReadyTime}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, maxReadyTime: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Time</option>
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 hour</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Health Score
                                </label>
                                <select
                                    value={selectedFilters.healthScore}
                                    onChange={(e) => setSelectedFilters({ ...selectedFilters, healthScore: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any Score</option>
                                    <option value="8">8+ (Very Healthy)</option>
                                    <option value="6">6+ (Healthy)</option>
                                    <option value="4">4+ (Moderate)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {loading ? 'Searching...' : `Found ${recipes.length} recipes`}
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recipes.map((recipe) => (
                            <div key={recipe.id} className="card hover:shadow-lg transition-shadow duration-200">
                                <div className="relative">
                                    <img
                                        src={recipe.image}
                                        alt={recipe.title}
                                        className="w-full h-48 object-cover rounded-lg mb-4"
                                    />
                                    <button
                                        onClick={() => toggleFavorite(recipe.id)}
                                        className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${recipe.isFavorite
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                                            }`}
                                    >
                                        <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
                                    </button>
                                    <div className="absolute top-2 left-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreColor(recipe.healthScore)}`}>
                                            Health: {recipe.healthScore}/10
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                                        {recipe.title}
                                    </h3>

                                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center space-x-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{recipe.readyInMinutes} min</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Users className="w-4 h-4" />
                                            <span>{recipe.servings} servings</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {recipe.cuisines.map((cuisine) => (
                                            <span
                                                key={cuisine}
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getCuisineColor(cuisine)}`}
                                            >
                                                {cuisine}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                            <Flame className="w-4 h-4 text-red-600 mx-auto mb-1" />
                                            <p className="text-xs font-medium text-red-600">{recipe.calories}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">cal</p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                            <Target className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                                            <p className="text-xs font-medium text-blue-600">{recipe.protein}g</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">protein</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                                            <Zap className="w-4 h-4 text-green-600 mx-auto mb-1" />
                                            <p className="text-xs font-medium text-green-600">{recipe.carbs}g</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">carbs</p>
                                        </div>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
                                            <Apple className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                                            <p className="text-xs font-medium text-yellow-600">{recipe.fat}g</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">fat</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                        {recipe.summary}
                                    </p>

                                    <div className="flex space-x-2">
                                        <button className="flex-1 btn-primary flex items-center justify-center space-x-2">
                                            <BookOpen className="w-4 h-4" />
                                            <span>View Recipe</span>
                                        </button>
                                        <button className="btn-secondary flex items-center space-x-2">
                                            <ChefHat className="w-4 h-4" />
                                            <span>Cook</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
