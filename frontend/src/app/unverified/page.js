'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  Search, 
  CheckCircle,
  ArrowRight,
  Info
} from 'lucide-react';

export default function UnverifiedPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth?redirect=/unverified');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Identity Verification Required
            </h1>
            <Badge variant="destructive" className="text-sm">
              Status: Unverified
            </Badge>
          </div>

          {/* Main Notice Card */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Official Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                As per government regulations, identity verification is mandatory for accessing 
                government digital services. Your account is currently in an unverified state.
              </p>
              
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-foreground">Important Information</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Please complete the identity verification process to access all features 
                  and services. This is a one-time process and your information will be 
                  securely stored as per data protection guidelines.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Required Documents Section */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Information Required for Verification</CardTitle>
              <CardDescription>Please keep the following ready before proceeding</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Aadhaar Card</p>
                    <p className="text-sm text-muted-foreground">Clear image in JPG/PNG format (max 2MB)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">PAN Card</p>
                    <p className="text-sm text-muted-foreground">Clear image in JPG/PNG format (max 2MB)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Personal Information</p>
                    <p className="text-sm text-muted-foreground">Full name, mobile number, and complete address</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Live Selfie</p>
                    <p className="text-sm text-muted-foreground">Real-time photo capture for biometric verification</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Verification Steps */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Verification Process Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Step 1: Submit Application</p>
                    <p className="text-sm text-muted-foreground">Fill out the verification form with accurate details</p>
                  </div>
                </div>
                
                <div className="ml-5 border-l-2 border-border h-6"></div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Step 2: Automated Review</p>
                    <p className="text-sm text-muted-foreground">System validates your submitted documents</p>
                  </div>
                </div>
                
                <div className="ml-5 border-l-2 border-border h-6"></div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Step 3: Status Update</p>
                    <p className="text-sm text-muted-foreground">Receive verification status notification</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Button */}
          <div className="text-center">
            <Button 
              onClick={() => router.push('/verification/form')}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              Proceed to Verification
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Estimated time: 5-10 minutes
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}