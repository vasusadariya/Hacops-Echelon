'use client';

import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

export { useAuth } from '@/lib/auth-context';

export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }) => {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const { data } = await api.post('/api/auth/reset-password', { token, password });
      return data;
    },
  });
}
