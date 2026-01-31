'use client';

import { BarChart3, Fingerprint, FileCheck, Zap } from 'lucide-react';

export function ServicesSection() {
  const services = [
    {
      icon: FileCheck,
      title: 'Document Verification',
      description:
        'Verification of submitted documents through structured checks and cross-reference mechanisms.',
    },
    {
      icon: Fingerprint,
      title: 'Biometric Verification',
      description:
        'Identity verification using facial, voice, or fingerprint-based signals where applicable.',
    },
    {
      icon: BarChart3,
      title: 'Application Consistency Review',
      description:
        'Review of application data to identify inconsistencies or unusual patterns.',
    },
    {
      icon: Zap,
      title: 'Fraud Risk Assessment',
      description:
        'Detection of high-risk identity submissions through layered verification safeguards.',
    },
  ];

  return (
    <section className="bg-accent/30 py-16 px-4">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4">
          Know About Our Services
        </h2>

        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          A comprehensive identity verification framework designed to support
          secure and compliant KYC processes.
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
                  {service.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
