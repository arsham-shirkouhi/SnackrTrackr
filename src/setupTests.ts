import '@testing-library/jest-dom'

// Mock Firebase
jest.mock('./firebase', () => ({
    auth: {
        currentUser: null,
        onAuthStateChanged: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        createUserWithEmailAndPassword: jest.fn(),
        signOut: jest.fn(),
    },
    db: {},
}))

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
    value: {
        VITE_FIREBASE_API_KEY: 'mock-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'mock-project.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'mock-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'mock-project.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: 'mock-app-id',
        VITE_OPENAI_API_KEY: 'mock-openai-key',
        VITE_EDAMAM_APP_ID: 'mock-edamam-id',
        VITE_EDAMAM_APP_KEY: 'mock-edamam-key',
        VITE_SPOONACULAR_API_KEY: 'mock-spoonacular-key',
        VITE_API_BASE_URL: 'http://localhost:5000/api',
    },
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: jest.fn(),
    },
})
