'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    { number: '1', key: 'step1' },
    { number: '2', key: 'step2' },
    { number: '3', key: 'step3' },
    { number: '4', key: 'step4' },
  ];

  return (
    <section className="bg-background py-16 px-4">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">
          {t('title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {steps.map((step, index) => (
            <div key={index}>
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-semibold text-lg">
                    {step.number}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-semibold mb-2">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:flex justify-end mt-4 mb-4">
                  <ArrowRight className="w-5 h-5 text-muted-foreground -rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Security & Privacy */}
        <div className="bg-accent/40 rounded-md p-8 border border-border">
          <h3 className="text-lg font-semibold mb-4">
            {t('security.title')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🔒 {t('security.dataProtection.title')}</h4>
              <p className="text-muted-foreground">
                {t('security.dataProtection.description')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🛡️ {t('security.secureSystems.title')}</h4>
              <p className="text-muted-foreground">
                {t('security.secureSystems.description')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📋 {t('security.compliance.title')}</h4>
              <p className="text-muted-foreground">
                {t('security.compliance.description')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}