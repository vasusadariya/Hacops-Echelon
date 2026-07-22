'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-card text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* About */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t('about.title')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-foreground">{t('about.aboutUs')}</Link></li>
              <li><Link href="/mission" className="hover:text-foreground">{t('about.mission')}</Link></li>
              <li><Link href="/team" className="hover:text-foreground">{t('about.team')}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t('services.title')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-foreground">{t('services.documentVerification')}</Link></li>
              <li><Link href="/services" className="hover:text-foreground">{t('services.biometricVerification')}</Link></li>
              <li><Link href="/services" className="hover:text-foreground">{t('services.identityValidation')}</Link></li>
              <li><Link href="/services" className="hover:text-foreground">{t('services.kycCompliance')}</Link></li>
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t('links.title')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-foreground">{t('links.faq')}</Link></li>
              <li><Link href="/help" className="hover:text-foreground">{t('links.support')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t('contact.title')}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>{t('contact.phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>{t('contact.email')}</span>
              </div>
              <p className="mt-4 text-sm">
                {t('contact.ministry')}<br />
                {t('contact.government')}
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="border-t border-border pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

            <div>
              <h4 className="font-semibold text-foreground mb-2">
                {t('languages')}
              </h4>
              <LanguageSwitcher />
            </div>

            <div className="md:text-center">
              <p>
                {t('copyright')}
              </p>
              <p className="text-xs mt-1">
                {t('ministryFull')}
              </p>
            </div>

            <div className="md:text-right">
              <p>{t('accessibility')}</p>
              <p className="text-xs mt-1">
                {t('lastUpdated')}
              </p>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}