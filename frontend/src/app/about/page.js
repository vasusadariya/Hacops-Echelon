'use client';

import Link from 'next/link';
import Navbar from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Shield, 
  Users, 
  FileCheck, 
  ChevronRight,
  Globe,
  Lock,
  Zap
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <Building2 className="h-3 w-3 mr-1" />
            Government of India Initiative
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            About Us
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            National Identity Verification Portal - A Digital India Initiative
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-12">
        
        {/* About Section */}
        <Card className="border-border mb-8">
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed mb-4">
              The <strong className="text-foreground">National Identity Verification Portal</strong> is 
              an official initiative under the Ministry of Electronics and Information Technology, 
              Government of India. Launched as part of the Digital India programme, this portal 
              provides secure, paperless identity verification services to citizens across the nation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform leverages advanced verification technologies to detect synthetic identities 
              and fraudulent documents, ensuring that only genuine citizens access government services 
              while maintaining the highest standards of data privacy and security.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border text-center">
            <CardContent className="p-5">
              <div className="inline-flex p-2 bg-blue-50 rounded-lg mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-sm mb-1">Secure Platform</h3>
              <p className="text-xs text-muted-foreground">
                Government-grade encryption & data protection
              </p>
            </CardContent>
          </Card>

          <Card className="border-border text-center">
            <CardContent className="p-5">
              <div className="inline-flex p-2 bg-green-50 rounded-lg mb-3">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-medium text-sm mb-1">Fast Processing</h3>
              <p className="text-xs text-muted-foreground">
                Most verifications completed in 24-48 hours
              </p>
            </CardContent>
          </Card>

          <Card className="border-border text-center">
            <CardContent className="p-5">
              <div className="inline-flex p-2 bg-purple-50 rounded-lg mb-3">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-sm mb-1">Accessible</h3>
              <p className="text-xs text-muted-foreground">
                Available in multiple languages nationwide
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance */}
        <Card className="border-border bg-muted/30 mb-8">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">Regulatory Compliance</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              This portal operates in full compliance with the Information Technology Act, 2000, 
              Digital Personal Data Protection Act, 2023, and all applicable KYC guidelines 
              issued by the Government of India.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/mission">
            <Button variant="outline" size="sm">
              Mission & Vision
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href="/team">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" />
              Our Team
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="outline" size="sm">
              <FileCheck className="h-4 w-4 mr-1" />
              Our Services
            </Button>
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}