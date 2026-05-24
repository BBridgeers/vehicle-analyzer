import { createAuthClient } from 'next-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXTAUTH_URL || 'https://veracar.co',
});

export const { signIn, signOut, signUp, signInWithOAuth, resetPassword } = authClient;
