'use client';

import Link from 'next/link';
import Navbar from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  FileCheck,
  Fingerprint,
  Clock,
  CheckCircle,
  Users,
  Building2,
  Lock,
  BadgeCheck,
  ArrowRight,
  Phone,
  HelpCircle,
  Scale,
  Eye,
  FileText,
  UserCheck
} from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-linear-to-r from-primary to-destructive py-16 px-4">
        <div className="max-w-5xl mx-auto text-center text-primary-foreground">
          <Badge className="bg-white/20 text-white mb-4 px-4 py-1">
            <Building2 className="h-3 w-3 mr-1" />
            Government of India Initiative
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Know Our Services
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            A secure, transparent, and citizen-friendly platform for identity verification 
            under the Digital India programme.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">

        {/* Mission Statement */}
        <section className="mb-16">
          <div className="bg-accent/30 rounded-lg p-8 border border-border">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">Our Commitment</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The National Identity Verification Portal is committed to providing secure, 
                  efficient, and accessible identity verification services to all citizens of India. 
                  We uphold the highest standards of data protection, transparency, and public service 
                  as mandated by the Government of India.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Services */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Verification Services
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comprehensive identity verification through multi-layered security checks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Verification */}
            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Document Verification</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Verification of government-issued identity documents including Aadhaar Card 
                  and PAN Card through secure validation processes.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Aadhaar Card validation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>PAN Card authenticity check</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Document tampering detection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Biometric Verification */}
            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Fingerprint className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Biometric Verification</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Multi-angle face capture and liveness detection to ensure the applicant 
                  is physically present during verification.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>4-angle face verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Liveness detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Deepfake prevention</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Fraud Detection */}
            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Fraud Prevention</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Advanced systems to detect and prevent synthetic identity fraud and 
                  automated bot submissions.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Behavioral analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Bot detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Synthetic identity detection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Officer Review */}
            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Officer Review</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Human oversight by trained government officers for applications requiring 
                  additional verification.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Manual document review</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Cross-verification checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Fair decision process</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trust & Security */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Trust & Security
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your data is protected by government-grade security measures
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-accent/30 rounded-lg border border-border">
              <div className="inline-flex p-3 bg-green-100 rounded-full mb-4">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Data Protection</h3>
              <p className="text-sm text-muted-foreground">
                All personal data is encrypted and stored securely as per IT Act, 2000 
                and Digital Personal Data Protection Act, 2023.
              </p>
            </div>

            <div className="text-center p-6 bg-accent/30 rounded-lg border border-border">
              <div className="inline-flex p-3 bg-blue-100 rounded-full mb-4">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Transparency</h3>
              <p className="text-sm text-muted-foreground">
                Track your application status in real-time. All decisions are recorded 
                with clear reasoning.
              </p>
            </div>

            <div className="text-center p-6 bg-accent/30 rounded-lg border border-border">
              <div className="inline-flex p-3 bg-purple-100 rounded-full mb-4">
                <BadgeCheck className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Government Certified</h3>
              <p className="text-sm text-muted-foreground">
                An initiative under the Ministry of Electronics and Information Technology, 
                Government of India.
              </p>
            </div>
          </div>
        </section>

        {/* Process Timeline */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Verification Process
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simple, transparent, and efficient verification in a few steps
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border" />
            
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="md:w-1/2 md:text-right md:pr-8">
                  <h3 className="font-semibold text-lg">1. Register & Login</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create an account using your email and secure password.
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold z-10">
                  1
                </div>
                <div className="md:w-1/2 md:pl-8" />
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="md:w-1/2 md:pr-8" />
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold z-10">
                  2
                </div>
                <div className="md:w-1/2 md:text-left md:pl-8">
                  <h3 className="font-semibold text-lg">2. Submit Documents</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload clear images of your Aadhaar and PAN cards.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="md:w-1/2 md:text-right md:pr-8">
                  <h3 className="font-semibold text-lg">3. Biometric Capture</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete face verification from multiple angles.
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold z-10">
                  3
                </div>
                <div className="md:w-1/2 md:pl-8" />
              </div>

              {/* Step 4 */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="md:w-1/2 md:pr-8" />
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold z-10">
                  4
                </div>
                <div className="md:w-1/2 md:text-left md:pl-8">
                  <h3 className="font-semibold text-lg">4. Automated Verification</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your application undergoes automated security checks.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="md:w-1/2 md:text-right md:pr-8">
                  <h3 className="font-semibold text-lg">5. Officer Review</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A government officer reviews and approves your application.
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold z-10">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="md:w-1/2 md:pl-8" />
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="mb-16">
          <div className="bg-linear-to-r from-primary/5 to-destructive/5 rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold mb-6 text-center">Why Use This Service?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Quick Processing</h4>
                <p className="text-xs text-muted-foreground">
                  Most applications processed within 24-48 hours
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Secure Platform</h4>
                <p className="text-xs text-muted-foreground">
                  Government-grade encryption and security
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Accessible to All</h4>
                <p className="text-xs text-muted-foreground">
                  Available in multiple languages for all citizens
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Paperless Process</h4>
                <p className="text-xs text-muted-foreground">
                  Complete digital verification, no physical visits
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Help & Support */}
        <section className="mb-16">
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent rounded-lg">
                    <HelpCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Need Assistance?</h3>
                    <p className="text-sm text-muted-foreground">
                      Our support team is available to help you with any queries.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>1800-XXX-XXXX (Toll Free)</span>
                  </div>
                  <Link href="/auth">
                    <Button className="bg-primary hover:bg-primary/90">
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Legal Notice */}
        <section>
          <div className="text-center text-xs text-muted-foreground border-t border-border pt-8">
            <p className="mb-2">
              This portal is an official service of the Government of India under the 
              Ministry of Electronics and Information Technology.
            </p>
            <p>
              All services are provided in accordance with the Information Technology Act, 2000 
              and applicable rules and regulations.
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}