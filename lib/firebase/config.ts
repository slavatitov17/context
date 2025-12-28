import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Отладочная информация
console.log('=== Firebase Config Debug ===');
console.log('API Key exists:', !!apiKey);
console.log('API Key value:', apiKey ? `${apiKey.substring(0, 15)}...` : 'UNDEFINED');
console.log('API Key length:', apiKey?.length || 0);
console.log('Auth Domain:', authDomain || 'UNDEFINED');
console.log('Project ID:', projectId || 'UNDEFINED');

// Проверка на случайные значения
if (apiKey && (apiKey.includes('ваш') || apiKey.includes('your'))) {
  console.error('ERROR: API Key contains placeholder text! Please use real Firebase API key from Firebase Console.');
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Проверка обязательных переменных окружения
if (!apiKey || !authDomain || !projectId) {
  const missing = [];
  if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  
  throw new Error(
    `Missing Firebase environment variables: ${missing.join(', ')}. ` +
    'Please check your .env.local file and restart the dev server.'
  );
}

// Инициализируем Firebase только один раз
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Инициализируем сервисы
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export default app;


