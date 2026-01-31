    'use client';
    import React from 'react';
    import { ArrowRight } from 'lucide-react';

    export function HowItWorks() {
    const steps = [
        {
        number: '1',
        title: 'Submit Your Documents',
        description:
            'Upload your identity documents and required verification details through the secure portal.',
        },
        {
        number: '2',
        title: 'Automated Verification',
        description:
            'The system performs document checks and identity validation using official verification mechanisms.',
        },
        {
        number: '3',
        title: 'Application Review',
        description:
            'Consistency and application data are reviewed across submitted information and records.',
        },
        {
        number: '4',
        title: 'Verification Complete',
        description:
            'Receive your verification status along with applicable compliance information.',
        },
    ];

    return (
        <section className="bg-background py-16 px-4">
        <div className="max-w-7xl mx-auto">

            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">
            How Verification Works
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
                        {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {step.description}
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
                Security & Privacy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                <h4 className="font-semibold mb-2">🔒 Data Protection</h4>
                <p className="text-muted-foreground">
                    All information is protected using secure transmission and storage practices.
                </p>
                </div>

                <div>
                <h4 className="font-semibold mb-2">🛡️ Secure Systems</h4>
                <p className="text-muted-foreground">
                    Multi-layer safeguards are in place to prevent misuse and unauthorized access.
                </p>
                </div>

                <div>
                <h4 className="font-semibold mb-2">📋 Regulatory Compliance</h4>
                <p className="text-muted-foreground">
                    Processes are aligned with applicable KYC and data-handling guidelines.
                </p>
                </div>
            </div>
            </div>

        </div>
        </section>
    );
    }
