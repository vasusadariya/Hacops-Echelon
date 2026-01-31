'use client';

import { useRouter } from 'next/navigation';

export function useLocale() {
  if (typeof window === 'undefined') return 'en';
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1] || 'en';
}

export function useChangeLocale() {
  const router = useRouter();
  
  const changeLocale = (newLocale) => {
    // Set cookie for 1 year
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    // Refresh the page to apply new locale
    router.refresh();
  };
  
  return changeLocale;
}