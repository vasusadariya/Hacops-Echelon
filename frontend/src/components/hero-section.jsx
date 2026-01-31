'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export function HeroSection() {
  const t = useTranslations('hero');

  return (
    <section className="relative bg-linear-to-r from-primary to-destructive overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-size-[20px_20px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Content */}
        <div className="text-primary-foreground">
          <p className="text-sm font-semibold text-yellow-200 mb-3 tracking-wide">
            {t('welcome')}
          </p>

          <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight text-balance">
            {t('headline')}
          </h2>

          <p className="text-lg text-yellow-100 mb-8 max-w-xl">
            {t('description')}
          </p>
          <Link href="/verification">
            <Button className="hidden sm:inline-flex">
              {t('startVerification')}
            </Button>
          </Link>
        </div>

        {/* Right Content – Identity Card Mock */}
        <div className="flex items-center justify-center">
          <div className="perspective">
            <div className="bg-linear-to-r from-neutral-800 to-neutral-900 rounded-md shadow-2xl p-6 max-w-sm transform hover:scale-105 transition-transform duration-300 border-4 border-secondary">
              
              <div className="bg-linear-to-r from-secondary to-emerald-800 rounded text-center py-8 mb-4">
                <p className="text-yellow-300 text-sm font-semibold mb-2">
                  {t('bharatGanrajya')}
                </p>
                <p className="text-yellow-300 text-sm font-semibold">
                  {t('republicOfIndia')}
                </p>
              </div>

              <div className="text-center">
                <div className="text-6xl mb-4">🏛️</div>
                <p className="text-yellow-300 font-semibold text-lg mb-2">
                  {t('parichayPatra')}
                </p>
                <p className="text-yellow-300 font-semibold text-2xl">
                  {t('identityCard')}
                </p>
              </div>

              <div className="border-t-2 border-secondary mt-4 pt-4 text-neutral-300 text-xs text-center">
                <p className="mb-2">{t('secureDocument')}</p>
                <p>{t('verifiedSystems')}</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}