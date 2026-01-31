'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// Query keys
export const authKeys = {
  all: ['auth'],
  user: () => [...authKeys.all, 'user'],
};

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await api.post('/api/auth/login', { email, password });
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(authKeys.user(), data.user);
    },
  });
}

// Register mutation
export function useRegister() {
  return useMutation({
    mutationFn: async ({ name, email, password }) => {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      return data;
    },
  });
}

// Forgot password mutation
export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }) => {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      return data;
    },
  });
}

// Reset password mutation
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const { data } = await api.post('/api/auth/reset-password', { token, password });
      return data;
    },
  });
}

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return null;
      const { data } = await api.get('/api/auth/me');
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Logout
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(authKeys.user(), null);
    queryClient.clear();
  };
}