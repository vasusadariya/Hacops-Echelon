'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLocale, useChangeLocale } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const changeLocaleCookie = useChangeLocale();
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    setCurrentLocale(useLocale());
  }, []);

  const changeLocale = (newLocale) => {
    changeLocaleCookie(newLocale);
    setCurrentLocale(newLocale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLocale === 'hi' ? 'हिन्दी' : 'English'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => changeLocale('en')}
          className={currentLocale === 'en' ? 'bg-accent' : ''}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLocale('hi')}
          className={currentLocale === 'hi' ? 'bg-accent' : ''}
        >
          🇮🇳 हिन्दी
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}