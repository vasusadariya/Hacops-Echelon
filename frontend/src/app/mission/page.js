'use client';

import Navbar from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Eye, Compass, CheckCircle } from 'lucide-react';

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-2 bg-primary/10 rounded-full mb-4">
            <Compass className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Mission & Vision
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Our guiding principles for a Digital India
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Mission */}
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">Our Mission</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                To provide secure, efficient, and accessible identity verification services 
                to every citizen of India, ensuring fraud prevention while maintaining 
                the highest standards of data privacy and user experience.
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">Our Vision</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A digitally empowered India where every citizen can securely verify 
                their identity online, eliminating fraud and enabling seamless access 
                to government and private services.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <Card className="border-border">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Security First', desc: 'Protecting citizen data with highest standards' },
                { title: 'Accessibility', desc: 'Services available to all, regardless of location' },
                { title: 'Transparency', desc: 'Clear processes with trackable status' },
                { title: 'Efficiency', desc: 'Fast processing with minimal paperwork' },
              ].map((value, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">{value.title}</h4>
                    <p className="text-xs text-muted-foreground">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>

      <Footer />
    </div>
  );
}