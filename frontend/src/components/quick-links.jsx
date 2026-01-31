'use client';

import { Globe, Calendar, MapPin, MessageSquare, Zap } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function QuickLinks() {
  const t = useTranslations('quickLinks');

  const links = [
    {
      icon: Globe,
      titleKey: 'applyVerification',
      href: '/apply',
    },
    {
      icon: Calendar,
      titleKey: 'checkStatus',
      href: '/status',
    },
    {
      icon: MapPin,
      titleKey: 'trackProcess',
      href: '/track',
    },
    {
      icon: MessageSquare,
      titleKey: 'registerFeedback',
      href: '/feedback',
    },
    {
      icon: Zap,
      titleKey: 'knowServices',
      href: '/services',
    },
  ];

  return (
    <section className="bg-background py-16 px-4 border-t-4 border-primary -mt-8 relative z-20">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">
          {t('title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {links.map((link, index) => {
            const Icon = link.icon;

            return (
              <Link key={index} href={link.href}>
                <div className="h-full bg-card border border-border rounded-md p-6 cursor-pointer transition-colors hover:bg-accent">
                  <div className="flex flex-col items-center text-center h-full">

                    <div className="mb-4 p-3 rounded-md bg-accent">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>

                    <h3 className="text-base font-semibold mb-2">
                      {t(`${link.titleKey}.title`)}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {t(`${link.titleKey}.description`)}
                    </p>

                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}