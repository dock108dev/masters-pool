import { useContext } from 'react';
import { AuthContext, type Session } from './authContext';

export function useSession(): Session {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useSession must be used inside an <AuthProvider>');
  }
  return ctx;
}
