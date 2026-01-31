import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['en', 'hi'];
export const defaultLocale = 'en';

export default getRequestConfig(async () => {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || defaultLocale;
  
  // Validate that the locale is supported
  const validLocale = locales.includes(locale) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
});