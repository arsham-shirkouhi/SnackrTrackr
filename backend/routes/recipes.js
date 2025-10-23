const express = require('express');
const axios = require('axios');
const router = express.Router();

// Spoonacular API configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Edamam API configuration
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';

// Search recipes
router.get('/search', async (req, res) => {
    try {
        const {
            query,
            cuisine,
            diet,
            mealType,
            maxReadyTime,
            healthScore,
            offset = 0,
            number = 12
        } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        // Build search parameters
        const params = {
            query,
            number: parseInt(number),
            offset: parseInt(offset),
            apiKey: SPOONACULAR_API_KEY
        };

        if (cuisine) params.cuisine = cuisine;
        if (diet) params.diet = diet;
        if (mealType) params.type = mealType;
        if (maxReadyTime) params.maxReadyTime = parseInt(maxReadyTime);
        if (healthScore) params.minHealthScore = parseInt(healthScore);

        const response = await axios.get(`${SPOONACULAR_BASE_URL}/complexSearch`, { params });

        // Transform the response to include nutrition info
        const recipes = await Promise.all(
            response.data.results.map(async (recipe) => {
                try {
                    // Get nutrition information
                    const nutritionResponse = await axios.get(
                        `${SPOONACULAR_BASE_URL}/${recipe.id}/nutritionWidget.json`,
                        { params: { apiKey: SPOONACULAR_API_KEY } }
                    );

                    return {
                        id: recipe.id,
                        title: recipe.title,
                        image: recipe.image,
                        readyInMinutes: recipe.readyInMinutes,
                        servings: recipe.servings,
                        healthScore: recipe.healthScore,
                        cuisines: recipe.cuisines || [],
                        dishTypes: recipe.dishTypes || [],
                        summary: recipe.summary,
                        nutrition: {
                            calories: nutritionResponse.data.calories || 0,
                            protein: nutritionResponse.data.protein || 0,
                            carbs: nutritionResponse.data.carbs || 0,
                            fat: nutritionResponse.data.fat || 0
                        }
                    };
                } catch (error) {
                    console.error(`Error fetching nutrition for recipe ${recipe.id}:`, error.message);
                    return {
                        id: recipe.id,
                        title: recipe.title,
                        image: recipe.image,
                        readyInMinutes: recipe.readyInMinutes,
                        servings: recipe.servings,
                        healthScore: recipe.healthScore,
                        cuisines: recipe.cuisines || [],
                        dishTypes: recipe.dishTypes || [],
                        summary: recipe.summary,
                        nutrition: {
                            calories: 0,
                            protein: 0,
                            carbs: 0,
                            fat: 0
                        }
                    };
                }
            })
        );

        res.json({
            recipes,
            totalResults: response.data.totalResults,
            offset: parseInt(offset),
            number: parseInt(number)
        });

    } catch (error) {
        console.error('Recipe search error:', error.message);
        res.status(500).json({
            error: 'Failed to search recipes',
            message: error.message
        });
    }
});

// Get recipe details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { includeNutrition = true } = req.query;

        const params = {
            apiKey: SPOONACULAR_API_KEY,
            includeNutrition: includeNutrition === 'true'
        };

        const response = await axios.get(`${SPOONACULAR_BASE_URL}/${id}/information`, { params });

        const recipe = {
            id: response.data.id,
            title: response.data.title,
            image: response.data.image,
            readyInMinutes: response.data.readyInMinutes,
            servings: response.data.servings,
            healthScore: response.data.healthScore,
            cuisines: response.data.cuisines || [],
            dishTypes: response.data.dishTypes || [],
            summary: response.data.summary,
            ingredients: response.data.extendedIngredients?.map(ing => ({
                id: ing.id,
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                image: ing.image
            })) || [],
            instructions: response.data.analyzedInstructions?.[0]?.steps?.map(step => step.step) || [],
            nutrition: response.data.nutrition ? {
                calories: response.data.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0,
                protein: response.data.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0,
                carbs: response.data.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
                fat: response.data.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0
            } : null
        };

        res.json(recipe);

    } catch (error) {
        console.error('Recipe details error:', error.message);
        res.status(500).json({
            error: 'Failed to get recipe details',
            message: error.message
        });
    }
});

// Get random recipes
router.get('/random', async (req, res) => {
    try {
        const { number = 6, tags } = req.query;

        const params = {
            number: parseInt(number),
            apiKey: SPOONACULAR_API_KEY
        };

        if (tags) params.tags = tags;

        const response = await axios.get(`${SPOONACULAR_BASE_URL}/random`, { params });

        const recipes = response.data.recipes.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            healthScore: recipe.healthScore,
            cuisines: recipe.cuisines || [],
            dishTypes: recipe.dishTypes || [],
            summary: recipe.summary
        }));

        res.json({ recipes });

    } catch (error) {
        console.error('Random recipes error:', error.message);
        res.status(500).json({
            error: 'Failed to get random recipes',
            message: error.message
        });
    }
});

// Get similar recipes
router.get('/:id/similar', async (req, res) => {
    try {
        const { id } = req.params;
        const { number = 6 } = req.query;

        const params = {
            number: parseInt(number),
            apiKey: SPOONACULAR_API_KEY
        };

        const response = await axios.get(`${SPOONACULAR_BASE_URL}/${id}/similar`, { params });

        const recipes = response.data.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            healthScore: recipe.healthScore
        }));

        res.json({ recipes });

    } catch (error) {
        console.error('Similar recipes error:', error.message);
        res.status(500).json({
            error: 'Failed to get similar recipes',
            message: error.message
        });
    }
});

module.exports = router;
