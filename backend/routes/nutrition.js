const express = require('express');
const axios = require('axios');
const router = express.Router();

// Edamam API configuration
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_BASE_URL = 'https://api.edamam.com/api/food-database/v2';

// Get nutrition information for a food item
router.get('/food/:foodId', async (req, res) => {
    try {
        const { foodId } = req.params;

        const response = await axios.get(`${EDAMAM_BASE_URL}/parser`, {
            params: {
                app_id: EDAMAM_APP_ID,
                app_key: EDAMAM_APP_KEY,
                ingr: foodId
            }
        });

        if (response.data.hints && response.data.hints.length > 0) {
            const food = response.data.hints[0].food;

            const nutrition = {
                id: food.foodId,
                name: food.label,
                calories: food.nutrients.ENERC_KCAL || 0,
                protein: food.nutrients.PROCNT || 0,
                carbs: food.nutrients.CHOCDF || 0,
                fat: food.nutrients.FAT || 0,
                fiber: food.nutrients.FIBTG || 0,
                sugar: food.nutrients.SUGAR || 0,
                sodium: food.nutrients.NA || 0,
                serving: food.measure || '100g'
            };

            res.json(nutrition);
        } else {
            res.status(404).json({ error: 'Food not found' });
        }

    } catch (error) {
        console.error('Nutrition lookup error:', error.message);
        res.status(500).json({
            error: 'Failed to get nutrition information',
            message: error.message
        });
    }
});

// Search for foods
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const response = await axios.get(`${EDAMAM_BASE_URL}/parser`, {
            params: {
                app_id: EDAMAM_APP_ID,
                app_key: EDAMAM_APP_KEY,
                ingr: q,
                limit: parseInt(limit)
            }
        });

        const foods = response.data.hints.map(hint => ({
            id: hint.food.foodId,
            name: hint.food.label,
            brand: hint.food.brand || null,
            category: hint.food.category,
            calories: hint.food.nutrients.ENERC_KCAL || 0,
            protein: hint.food.nutrients.PROCNT || 0,
            carbs: hint.food.nutrients.CHOCDF || 0,
            fat: hint.food.nutrients.FAT || 0,
            serving: hint.food.measure || '100g',
            image: hint.food.image || null
        }));

        res.json({ foods });

    } catch (error) {
        console.error('Food search error:', error.message);
        res.status(500).json({
            error: 'Failed to search foods',
            message: error.message
        });
    }
});

// Calculate daily nutrition totals
router.post('/calculate', async (req, res) => {
    try {
        const { meals } = req.body;

        if (!meals || !Array.isArray(meals)) {
            return res.status(400).json({ error: 'Meals array is required' });
        }

        const totals = meals.reduce((acc, meal) => {
            return {
                calories: acc.calories + (meal.calories || 0),
                protein: acc.protein + (meal.protein || 0),
                carbs: acc.carbs + (meal.carbs || 0),
                fat: acc.fat + (meal.fat || 0),
                fiber: acc.fiber + (meal.fiber || 0),
                sugar: acc.sugar + (meal.sugar || 0),
                sodium: acc.sodium + (meal.sodium || 0)
            };
        }, {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0
        });

        // Calculate percentages of daily values (based on 2000 calorie diet)
        const percentages = {
            calories: (totals.calories / 2000) * 100,
            protein: (totals.protein / 50) * 100, // 50g recommended daily protein
            carbs: (totals.carbs / 300) * 100, // 300g recommended daily carbs
            fat: (totals.fat / 65) * 100 // 65g recommended daily fat
        };

        res.json({
            totals,
            percentages,
            mealCount: meals.length,
            calculatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Nutrition calculation error:', error.message);
        res.status(500).json({
            error: 'Failed to calculate nutrition',
            message: error.message
        });
    }
});

// Get nutrition recommendations based on user profile
router.post('/recommendations', async (req, res) => {
    try {
        const {
            userProfile,
            currentIntake,
            goals
        } = req.body;

        if (!userProfile || !currentIntake || !goals) {
            return res.status(400).json({
                error: 'User profile, current intake, and goals are required'
            });
        }

        const recommendations = [];
        const warnings = [];

        // Calorie analysis
        const calorieDiff = currentIntake.calories - goals.dailyCalories;
        if (Math.abs(calorieDiff) > 200) {
            if (calorieDiff > 0) {
                warnings.push(`You're ${calorieDiff} calories over your daily goal`);
                recommendations.push('Consider reducing portion sizes or choosing lower-calorie options');
            } else {
                warnings.push(`You're ${Math.abs(calorieDiff)} calories under your daily goal`);
                recommendations.push('Add a healthy snack or increase portion sizes');
            }
        }

        // Protein analysis
        const proteinDiff = currentIntake.protein - goals.protein;
        if (proteinDiff < -20) {
            warnings.push(`You need ${Math.abs(proteinDiff)}g more protein`);
            recommendations.push('Add lean protein sources like chicken, fish, or legumes');
        }

        // Macro balance analysis
        const proteinPercentage = (currentIntake.protein * 4) / currentIntake.calories * 100;
        const carbsPercentage = (currentIntake.carbs * 4) / currentIntake.calories * 100;
        const fatPercentage = (currentIntake.fat * 9) / currentIntake.calories * 100;

        if (proteinPercentage < 15) {
            recommendations.push('Increase protein intake to 15-20% of total calories');
        }
        if (carbsPercentage > 60) {
            recommendations.push('Consider reducing carb intake and increasing protein/fat');
        }
        if (fatPercentage < 20) {
            recommendations.push('Add healthy fats like avocado, nuts, or olive oil');
        }

        // Activity level recommendations
        if (userProfile.activityLevel === 'sedentary' && currentIntake.calories > goals.dailyCalories) {
            recommendations.push('Consider increasing physical activity to support higher calorie intake');
        }

        // Age-specific recommendations
        if (userProfile.age > 50) {
            recommendations.push('Ensure adequate calcium and vitamin D intake for bone health');
        }

        const score = calculateNutritionScore(currentIntake, goals);

        res.json({
            recommendations,
            warnings,
            score,
            macroBalance: {
                protein: proteinPercentage,
                carbs: carbsPercentage,
                fat: fatPercentage
            },
            analysis: {
                calorieStatus: calorieDiff > 0 ? 'over' : calorieDiff < -200 ? 'under' : 'good',
                proteinStatus: proteinDiff > 0 ? 'good' : proteinDiff > -20 ? 'adequate' : 'low',
                balanceStatus: getBalanceStatus(proteinPercentage, carbsPercentage, fatPercentage)
            }
        });

    } catch (error) {
        console.error('Recommendations error:', error.message);
        res.status(500).json({
            error: 'Failed to get recommendations',
            message: error.message
        });
    }
});

// Helper function to calculate nutrition score
function calculateNutritionScore(currentIntake, goals) {
    let score = 100;

    // Calorie score (40% weight)
    const calorieDiff = Math.abs(currentIntake.calories - goals.dailyCalories);
    const calorieScore = Math.max(0, 100 - (calorieDiff / goals.dailyCalories) * 100);
    score = score * 0.4 + calorieScore * 0.4;

    // Protein score (30% weight)
    const proteinDiff = Math.abs(currentIntake.protein - goals.protein);
    const proteinScore = Math.max(0, 100 - (proteinDiff / goals.protein) * 100);
    score = score * 0.6 + proteinScore * 0.3;

    // Macro balance score (30% weight)
    const proteinPercentage = (currentIntake.protein * 4) / currentIntake.calories * 100;
    const balanceScore = proteinPercentage >= 15 && proteinPercentage <= 25 ? 100 :
        proteinPercentage >= 10 && proteinPercentage <= 30 ? 80 : 60;
    score = score * 0.7 + balanceScore * 0.3;

    return Math.round(score);
}

// Helper function to get balance status
function getBalanceStatus(protein, carbs, fat) {
    if (protein >= 15 && protein <= 25 && carbs >= 45 && carbs <= 65 && fat >= 20 && fat <= 35) {
        return 'excellent';
    } else if (protein >= 10 && protein <= 30 && carbs >= 40 && carbs <= 70 && fat >= 15 && fat <= 40) {
        return 'good';
    } else {
        return 'needs-improvement';
    }
}

module.exports = router;
