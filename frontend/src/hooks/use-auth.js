'use client';

// Re-export useAuth from auth-context
export { useAuth } from '@/lib/auth-context';

// If you need backward compatibility aliases, you can add them:
// But it's better to update all files to use useAuth directly

/*
// Legacy exports (if needed for backward compatibility)
import { useAuth as useAuthHook } from '@/lib/auth-context';

export const useCurrentUser = () => {
  const { user, loading } = useAuthHook();
  return { user, loading, isLoading: loading };
};

export const useLogout = () => {
  const { logout } = useAuthHook();
  return logout;
};
*/