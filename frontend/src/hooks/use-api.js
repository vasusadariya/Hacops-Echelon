'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

/**
 * Generic GET hook
 * @param {string} key - Query key for caching
 * @param {string} url - API endpoint
 * @param {object} options - Additional react-query options
 */
export function useGet(key, url, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const { data } = await api.get(url);
      return data;
    },
    ...options,
  });
}

/**
 * Generic POST hook
 * @param {string} url - API endpoint
 * @param {object} options - Additional mutation options
 */
export function usePost(url, options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post(url, body);
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch related queries
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}

/**
 * Generic PUT hook
 * @param {string} url - API endpoint
 * @param {object} options - Additional mutation options
 */
export function usePut(url, options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.put(url, body);
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}

/**
 * Generic DELETE hook
 * @param {string} url - API endpoint
 * @param {object} options - Additional mutation options
 */
export function useDelete(url, options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`${url}/${id}`);
      return data;
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}