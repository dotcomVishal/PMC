import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  projectId: "pmc-learning-fest",
  appId: "1:736714847031:web:2d30b9fac1e2e8e8fc60b2",
  storageBucket: "pmc-learning-fest.firebasestorage.app",
  apiKey: "AIzaSyBus7Hgmn9E2QuzargjP9lgFBUHk6szt_s",
  authDomain: "pmc-learning-fest.firebaseapp.com",
  messagingSenderId: "736714847031",
  measurementId: "G-LS7VP7W22W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// Hint the institute domain to Google OAuth prompt
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: 'students.iitmandi.ac.in'
});

export async function loginWithIITMandi(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const email = (user.email || '').toLowerCase();

  // Strict domain check: only @students.iitmandi.ac.in and @iitmandi.ac.in
  if (!email.endsWith('@students.iitmandi.ac.in') && !email.endsWith('@iitmandi.ac.in')) {
    await firebaseSignOut(auth);
    throw new Error('Access Denied: Only IIT Mandi student and institute emails (@students.iitmandi.ac.in / @iitmandi.ac.in) are allowed.');
  }

  return user;
}

export function logOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { User };
