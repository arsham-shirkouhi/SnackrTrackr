const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

// Initialize OpenAI only if API key is provided (optional feature)
let openai = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key' && OPENAI_API_KEY.trim() !== '') {
    try {
        openai = new OpenAI({
            apiKey: OPENAI_API_KEY,
        });
        console.log('✅ OpenAI initialized successfully');
    } catch (error) {
        console.warn('⚠️  OpenAI initialization failed:', error.message);
    }
} else {
    console.warn('⚠️  OpenAI API key not provided - AI recipe features will be disabled');
}

// Helper function to check if OpenAI is available
function isOpenAIAvailable() {
    return openai !== null;
}

// Generate AI recipe
router.post('/generate', async (req, res) => {
    try {
        if (!isOpenAIAvailable()) {
            return res.status(503).json({
                error: 'OpenAI API not configured',
                message: 'Please add OPENAI_API_KEY to your backend/.env file to use AI recipe generation'
            });
        }

        const {
            ingredients,
            dietaryPreferences,
            mealType,
            cookingTime,
            cuisine
        } = req.body;

        if (!ingredients || ingredients.trim().length === 0) {
            return res.status(400).json({ error: 'Ingredients are required' });
        }

        // Build the prompt for OpenAI
        let prompt = `Create a detailed recipe using these ingredients: ${ingredients}`;

        if (dietaryPreferences) {
            prompt += `\nDietary restrictions: ${dietaryPreferences}`;
        }
        if (mealType) {
            prompt += `\nMeal type: ${mealType}`;
        }
        if (cookingTime) {
            prompt += `\nMaximum cooking time: ${cookingTime} minutes`;
        }
        if (cuisine) {
            prompt += `\nCuisine style: ${cuisine}`;
        }

        prompt += `\n\nPlease provide the response in the following JSON format:
    {
      "title": "Recipe title",
      "description": "Brief description of the recipe",
      "prepTime": number in minutes,
      "cookTime": number in minutes,
      "servings": number,
      "difficulty": "Easy/Medium/Hard",
      "calories": number per serving,
      "protein": number in grams per serving,
      "carbs": number in grams per serving,
      "fat": number in grams per serving,
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": "quantity",
          "unit": "unit of measurement"
        }
      ],
      "instructions": [
        "Step 1 instruction",
        "Step 2 instruction"
      ],
      "tags": ["tag1", "tag2"],
      "tips": [
        "Helpful tip 1",
        "Helpful tip 2"
      ]
    }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional chef and nutritionist. Create detailed, healthy recipes with accurate nutritional information. Always respond with valid JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        const responseText = completion.choices[0].message.content;

        try {
            const recipe = JSON.parse(responseText);

            // Validate required fields
            if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
                throw new Error('Invalid recipe format');
            }

            // Add metadata
            recipe.id = Date.now().toString();
            recipe.generatedAt = new Date().toISOString();
            recipe.isAI = true;

            res.json(recipe);

        } catch (parseError) {
            console.error('Error parsing AI response:', parseError.message);
            console.error('Raw response:', responseText);

            // Fallback: try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const recipe = JSON.parse(jsonMatch[0]);
                    recipe.id = Date.now().toString();
                    recipe.generatedAt = new Date().toISOString();
                    recipe.isAI = true;
                    res.json(recipe);
                } catch (fallbackError) {
                    throw new Error('Failed to parse AI response');
                }
            } else {
                throw new Error('No valid JSON found in AI response');
            }
        }

    } catch (error) {
        console.error('AI recipe generation error:', error.message);
        res.status(500).json({
            error: 'Failed to generate recipe',
            message: error.message
        });
    }
});

// Get recipe suggestions based on user preferences
router.post('/suggest', async (req, res) => {
    try {
        if (!isOpenAIAvailable()) {
            return res.status(503).json({
                error: 'OpenAI API not configured',
                message: 'Please add OPENAI_API_KEY to your backend/.env file to use AI recipe suggestions'
            });
        }

        const {
            userProfile,
            recentMeals,
            goals,
            preferences
        } = req.body;

        if (!userProfile) {
            return res.status(400).json({ error: 'User profile is required' });
        }

        let prompt = `Based on this user profile, suggest 3 healthy recipes:
    - Weight: ${userProfile.weight}kg
    - Height: ${userProfile.height}cm
    - Age: ${userProfile.age} years
    - Activity Level: ${userProfile.activityLevel}
    - Daily Calorie Goal: ${userProfile.goals?.dailyCalories || 2000} calories
    - Protein Goal: ${userProfile.goals?.protein || 150}g
    `;

        if (recentMeals && recentMeals.length > 0) {
            prompt += `\nRecent meals: ${recentMeals.map(meal => meal.name).join(', ')}`;
        }

        if (preferences) {
            prompt += `\nDietary preferences: ${preferences}`;
        }

        prompt += `\n\nProvide 3 recipe suggestions in JSON format:
    {
      "suggestions": [
        {
          "title": "Recipe title",
          "reason": "Why this recipe is good for the user",
          "calories": number,
          "protein": number,
          "difficulty": "Easy/Medium/Hard",
          "cookingTime": number
        }
      ]
    }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a nutritionist and meal planner. Suggest personalized recipes based on user profiles and goals. Always respond with valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.8,
        });

        const responseText = completion.choices[0].message.content;

        try {
            const suggestions = JSON.parse(responseText);
            res.json(suggestions);
        } catch (parseError) {
            console.error('Error parsing suggestions:', parseError.message);
            res.status(500).json({
                error: 'Failed to parse suggestions',
                message: parseError.message
            });
        }

    } catch (error) {
        console.error('Recipe suggestions error:', error.message);
        res.status(500).json({
            error: 'Failed to get recipe suggestions',
            message: error.message
        });
    }
});

// Analyze nutrition and provide recommendations
router.post('/analyze', async (req, res) => {
    try {
        if (!isOpenAIAvailable()) {
            return res.status(503).json({
                error: 'OpenAI API not configured',
                message: 'Please add OPENAI_API_KEY to your backend/.env file to use AI nutrition analysis'
            });
        }

        const {
            dailyLog,
            goals,
            userProfile
        } = req.body;

        if (!dailyLog || !goals) {
            return res.status(400).json({ error: 'Daily log and goals are required' });
        }

        const prompt = `Analyze this daily nutrition log and provide recommendations:
    
    Daily Intake:
    - Calories: ${dailyLog.calories}/${goals.dailyCalories}
    - Protein: ${dailyLog.protein}/${goals.protein}g
    - Carbs: ${dailyLog.carbs}/${goals.carbs}g
    - Fat: ${dailyLog.fat}/${goals.fat}g
    
    User Profile:
    - Weight: ${userProfile?.weight || 'N/A'}kg
    - Activity Level: ${userProfile?.activityLevel || 'N/A'}
    
    Provide analysis and recommendations in JSON format:
    {
      "analysis": {
        "calorieStatus": "good/under/over",
        "proteinStatus": "good/under/over",
        "carbsStatus": "good/under/over",
        "fatStatus": "good/under/over"
      },
      "recommendations": [
        "Specific recommendation 1",
        "Specific recommendation 2"
      ],
      "suggestions": [
        "Food suggestion 1",
        "Food suggestion 2"
      ],
      "score": number from 1-10
    }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a nutritionist. Analyze daily nutrition logs and provide helpful, specific recommendations. Always respond with valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.6,
        });

        const responseText = completion.choices[0].message.content;

        try {
            const analysis = JSON.parse(responseText);
            res.json(analysis);
        } catch (parseError) {
            console.error('Error parsing analysis:', parseError.message);
            res.status(500).json({
                error: 'Failed to parse analysis',
                message: parseError.message
            });
        }

    } catch (error) {
        console.error('Nutrition analysis error:', error.message);
        res.status(500).json({
            error: 'Failed to analyze nutrition',
            message: error.message
        });
    }
});

module.exports = router;
