import React from 'react'
import { Link } from 'react-router-dom'
import { Utensils, Github, Twitter, Mail, HelpCircle } from 'lucide-react'

export const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                                <Utensils className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">SnackrTrackr</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Your personal nutrition tracker for a healthier lifestyle.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="font-semibold mb-4">Features</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/" className="hover:text-white transition-colors">Dashboard</Link></li>
                            <li><Link to="/meals" className="hover:text-white transition-colors">Meal Tracking</Link></li>
                            <li><Link to="/recipes" className="hover:text-white transition-colors">Recipe Search</Link></li>
                            <li><Link to="/ai-recipes" className="hover:text-white transition-colors">AI Recipes</Link></li>
                            <li><Link to="/goals" className="hover:text-white transition-colors">Goal Setting</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm">
                        © 2024 SnackrTrackr. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">Need help? Contact support</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
