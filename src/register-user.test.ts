import { test } from 'vitest';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';

test('register test user', async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@breakthrough.com', 'password123');
    console.log('User registered successfully:', userCredential.user.email);
  } catch (error) {
    console.error('Registration failed:', error);
  }
}, 30000);
