import React, { useState } from 'react'
import {
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Mail,
    MessageCircle,
    Send,
    Search,
    BookOpen,
    Shield,
    Zap,
    Target,
    Users
} from 'lucide-react'

interface FAQItem {
    id: string
    question: string
    answer: string
    category: string
}

export const FAQ: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
    const [feedback, setFeedback] = useState('')
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

    const faqItems: FAQItem[] = [
        {
            id: '1',
            question: 'How do I track my daily calories?',
            answer: 'To track your daily calories, go to the "Meals" page and click "Add Meal". You can search for foods in our database or manually enter the nutritional information. The app will automatically calculate your daily totals and show your progress toward your calorie goal.',
            category: 'tracking'
        },
        {
            id: '2',
            question: 'Can I generate recipes with AI?',
            answer: 'Yes! Our AI Recipe Generator can create personalized recipes based on your available ingredients. Simply go to the "AI Recipes" page, enter your ingredients, and specify any dietary preferences. Our AI will generate a complete recipe with nutritional information.',
            category: 'ai-features'
        },
        {
            id: '3',
            question: 'How accurate is the nutritional information?',
            answer: 'We use data from reputable sources like the USDA Food Database and verified nutrition databases. However, nutritional values can vary based on preparation methods and ingredient quality. For the most accurate tracking, we recommend using a food scale and checking labels when possible.',
            category: 'nutrition'
        },
        {
            id: '4',
            question: 'Can I set custom nutrition goals?',
            answer: 'Absolutely! Go to the "Goals" page to set personalized targets for calories, protein, carbs, fat, and weight. You can also set workout goals and track your progress over time with detailed charts and analytics.',
            category: 'goals'
        },
        {
            id: '5',
            question: 'Is my data secure and private?',
            answer: 'Yes, we take your privacy seriously. All data is encrypted and stored securely using Firebase. We never share your personal information with third parties. You can delete your account and all associated data at any time.',
            category: 'privacy'
        },
        {
            id: '6',
            question: 'How do I sync my data across devices?',
            answer: 'Your data is automatically synced across all devices when you sign in with the same account. Simply log in on any device and your meals, goals, and progress will be available immediately.',
            category: 'sync'
        },
        {
            id: '7',
            question: 'Can I export my nutrition data?',
            answer: 'Yes, you can export your nutrition data in CSV format from the Dashboard page. This includes your meal logs, nutritional breakdowns, and progress over time. This is useful for sharing with healthcare providers or nutritionists.',
            category: 'data'
        },
        {
            id: '8',
            question: 'What if I can\'t find a food in the database?',
            answer: 'If you can\'t find a specific food, you can manually add it with custom nutritional information. Go to "Add Meal" and select "Manual Entry" to input the food name and nutritional values. You can also suggest new foods to be added to our database.',
            category: 'tracking'
        },
        {
            id: '9',
            question: 'How does the AI recipe generation work?',
            answer: 'Our AI analyzes your ingredients and dietary preferences to create personalized recipes. It considers nutritional balance, cooking methods, and flavor combinations to suggest recipes that fit your goals and taste preferences.',
            category: 'ai-features'
        },
        {
            id: '10',
            question: 'Can I track workouts and exercise?',
            answer: 'Yes! You can log workouts and track calories burned. This helps adjust your daily calorie targets and provides a complete picture of your health and fitness journey. Go to the Goals page to set workout targets.',
            category: 'fitness'
        }
    ]

    const categories = [
        { id: 'all', label: 'All Questions', icon: BookOpen },
        { id: 'tracking', label: 'Food Tracking', icon: Target },
        { id: 'goals', label: 'Goals & Progress', icon: Zap },
        { id: 'ai-features', label: 'AI Features', icon: MessageCircle },
        { id: 'nutrition', label: 'Nutrition', icon: BookOpen },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
        { id: 'sync', label: 'Data & Sync', icon: Users },
        { id: 'data', label: 'Data Export', icon: BookOpen },
        { id: 'fitness', label: 'Fitness', icon: Target }
    ]

    const filteredItems = faqItems.filter(item => {
        const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedItems)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedItems(newExpanded)
    }

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (feedback.trim()) {
            setFeedbackSubmitted(true)
            setFeedback('')
            setTimeout(() => setFeedbackSubmitted(false), 3000)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Frequently Asked Questions
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Find answers to common questions about SnackrTrackr
                </p>
            </div>

            {/* Search and Filters */}
            <div className="card">
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => {
                            const Icon = category.icon
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.id
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{category.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="card text-center py-12">
                        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No questions found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Try adjusting your search terms or category filter
                        </p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className="card">
                            <button
                                onClick={() => toggleExpanded(item.id)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-4">
                                    {item.question}
                                </h3>
                                {expandedItems.has(item.id) ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                            </button>

                            {expandedItems.has(item.id) && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Contact Support */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Still need help?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Can't find the answer you're looking for? Send us your question and we'll get back to you as soon as possible.
                </p>

                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Question or Feedback
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Describe your question or share feedback..."
                            className="input-field min-h-[100px] resize-none"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Send className="w-4 h-4" />
                            <span>Send Message</span>
                        </button>
                        <a
                            href="mailto:support@snackrtrackr.com"
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Email Support</span>
                        </a>
                    </div>
                </form>

                {feedbackSubmitted && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-600 dark:text-green-400 text-sm">
                            Thank you! Your message has been sent. We'll get back to you within 24 hours.
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        User Guide
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Learn how to make the most of SnackrTrackr with our comprehensive guide.
                    </p>
                    <button className="btn-secondary text-sm">
                        Read Guide
                    </button>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Community
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Join our community to get tips, share recipes, and connect with others.
                    </p>
                    <button className="btn-secondary text-sm">
                        Join Community
                    </button>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Feature Requests
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Have an idea for a new feature? We'd love to hear your suggestions.
                    </p>
                    <button className="btn-secondary text-sm">
                        Suggest Feature
                    </button>
                </div>
            </div>
        </div>
    )
}
