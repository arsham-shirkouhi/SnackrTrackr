# SnackrTrackr 🍎

A comprehensive nutrition tracking web application that helps users monitor their daily food intake, discover healthy recipes, and achieve their nutrition goals with the power of AI.

## 🌟 Features

### Core Functionality
- **User Authentication** - Secure login/signup with Firebase Auth
- **Dashboard** - Real-time nutrition tracking with charts and progress visualization
- **Meal Logger** - Easy food logging with searchable database and manual entry
- **Recipe Search** - Discover healthy recipes with advanced filtering
- **AI Recipe Generator** - Generate personalized recipes using OpenAI
- **Goal Tracking** - Set and monitor nutrition and fitness goals
- **Progress Analytics** - Weekly trends and macro distribution charts

### AI-Powered Features
- **Smart Recipe Generation** - Create recipes from available ingredients
- **Nutrition Analysis** - AI-powered insights and recommendations
- **Personalized Suggestions** - Tailored recipe recommendations based on user profile

### User Experience
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark/Light Mode** - User preference theme switching
- **Real-time Updates** - Live progress tracking and goal monitoring
- **Intuitive Interface** - Clean, modern design with smooth animations

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Recharts** - Data visualization library
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Firebase Admin** - Server-side Firebase operations
- **OpenAI API** - AI recipe generation and analysis
- **Spoonacular API** - Recipe database and nutrition data
- **Edamam API** - Food database and nutrition information

### Database & Authentication
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Auth** - User authentication and management

### Development Tools
- **Jest** - Testing framework
- **React Testing Library** - Component testing utilities
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project
- API keys for external services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arsham-shirkouhi/snackrtrackr.git
   cd snackrtrackr
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Create `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # External APIs
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_EDAMAM_APP_ID=your_edamam_app_id
   VITE_EDAMAM_APP_KEY=your_edamam_app_key
   VITE_SPOONACULAR_API_KEY=your_spoonacular_api_key

   # Backend API
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

   Create `backend/.env` file:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # External APIs
   OPENAI_API_KEY=your_openai_api_key
   EDAMAM_APP_ID=your_edamam_app_id
   EDAMAM_APP_KEY=your_edamam_app_key
   SPOONACULAR_API_KEY=your_spoonacular_api_key

   # Firebase Admin
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   ```

5. **Set up Firebase**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Add your web app to the project
   - Download the Firebase config and add to `.env`

6. **Get API keys**
   - **OpenAI**: Sign up at [OpenAI](https://openai.com) and get an API key
   - **Spoonacular**: Sign up at [Spoonacular](https://spoonacular.com/food-api) for recipe data
   - **Edamam**: Sign up at [Edamam](https://developer.edamam.com) for nutrition data

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📁 Project Structure

```
snackrtrackr/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── context/            # React context providers
│   ├── __tests__/          # Test files
│   ├── firebase.ts         # Firebase configuration
│   └── main.tsx           # Application entry point
├── backend/
│   ├── routes/            # API route handlers
│   ├── server.js          # Express server
│   └── package.json       # Backend dependencies
├── public/                 # Static assets
└── README.md              # This file
```

## 🔧 API Endpoints

### Recipes
- `GET /api/recipes/search` - Search recipes
- `GET /api/recipes/:id` - Get recipe details
- `GET /api/recipes/random` - Get random recipes

### AI Features
- `POST /api/ai-recipes/generate` - Generate AI recipe
- `POST /api/ai-recipes/suggest` - Get recipe suggestions
- `POST /api/ai-recipes/analyze` - Analyze nutrition

### Nutrition
- `GET /api/nutrition/search` - Search foods
- `POST /api/nutrition/calculate` - Calculate daily totals
- `POST /api/nutrition/recommendations` - Get recommendations

### Feedback
- `POST /api/feedback` - Submit feedback
- `POST /api/feedback/ticket` - Create support ticket

## 🎨 Design System

The application uses a consistent design system with:
- **Primary Colors**: Blue gradient (#0ea5e9 to #d946ef)
- **Typography**: Inter font family
- **Spacing**: Tailwind's spacing scale
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and hover effects

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Backend (Railway/Heroku)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Database (Firebase)
- Firestore is automatically hosted
- Configure security rules for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for AI recipe generation capabilities
- **Spoonacular** for comprehensive recipe database
- **Edamam** for nutrition data
- **Firebase** for backend services
- **React** and **Tailwind CSS** communities

## 📞 Support

For support, email arsham.alishirkouhi@sjsu.edu or william.vu@sjsu.edu or create an issue in the GitHub repository.

---

Made with ❤️ by the team at D.C Corp
