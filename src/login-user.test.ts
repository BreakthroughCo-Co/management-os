import { test } from 'vitest';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';

test('login test user', async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@breakthrough.com', 'password123');
    console.log('User logged in successfully:', userCredential.user.email);
  } catch (error: any) {
    console.error('Login failed:', error.message, error.code);
  }
}, 30000);
