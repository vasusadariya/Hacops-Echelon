'use client';

import { Globe, Calendar, MapPin, MessageSquare, Zap } from 'lucide-react';
import Link from 'next/link';

export function QuickLinks() {
  const links = [
    {
      icon: Globe,
      title: 'Apply for Identity Verification',
      description: 'Start your identity verification process',
      href: '/apply',
    },
    {
      icon: Calendar,
      title: 'Check Application Status',
      description: 'Track the progress of your application',
      href: '/status',
    },
    {
      icon: MapPin,
      title: 'Track Verification Process',
      description: 'View verification stage and updates',
      href: '/track',
    },
    {
      icon: MessageSquare,
      title: 'Register Feedback / Grievance',
      description: 'Submit feedback or register a grievance',
      href: '/feedback',
    },
    {
      icon: Zap,
      title: 'Know About Services',
      description: 'View available verification services',
      href: '/services',
    },
  ];

  return (
    <section className="bg-background py-16 px-4 border-t-4 border-primary -mt-8 relative z-20">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">
          Quick Links
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
                      {link.title}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {link.description}
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
