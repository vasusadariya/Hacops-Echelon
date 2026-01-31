'use client';

import { BarChart3, Fingerprint, FileCheck, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ServicesSection() {
  const t = useTranslations('services');

  const services = [
    { icon: FileCheck, key: 'documentVerification' },
    { icon: Fingerprint, key: 'biometricVerification' },
    { icon: BarChart3, key: 'consistencyReview' },
    { icon: Zap, key: 'fraudAssessment' },
  ];

  return (
    <section className="bg-accent/30 py-16 px-4">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4">
          {t('title')}
        </h2>

        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <div
                key={index}
                className="bg-card rounded-md p-8 border border-border hover:bg-accent transition-colors"
              >
                <div className="mb-4 inline-flex p-3 rounded-md bg-accent">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-lg font-semibold mb-3">
                  {t(`${service.key}.title`)}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`${service.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}