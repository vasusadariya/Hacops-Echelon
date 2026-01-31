'use client';

import { useState, useEffect } from 'react'; 
import { useRouter, useSearchParams } from 'next/navigation';

import Navbar from '@/components/navbar';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileSearch,
  UserCheck,
  Loader2,
  RefreshCw,
  Home,
  ArrowRight
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { Footer } from '@/components/footer';

const statusConfig = {
  not_started: {
    label: 'Not Started',
    color: 'bg-muted text-muted-foreground',
    icon: Clock,
    description: 'You have not started the verification process yet.'
  },
  draft: {
    label: 'Draft',
    color: 'bg-muted text-muted-foreground',
    icon: Clock,
    description: 'Your application is saved as draft. Please complete and submit.'
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-primary/10 text-primary',
    icon: FileSearch,
    description: 'Your application has been submitted and is awaiting processing.'
  },
  under_automated_verification: {
    label: 'Under Automated Verification',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: FileSearch,
    description: 'Your documents are being verified by our automated system.'
  },
  under_officer_review: {
    label: 'Under Officer Review',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: UserCheck,
    description: 'Your application is under manual review by a verification officer.'
  },
  approved: {
    label: 'Approved',
    color: 'bg-secondary/10 text-secondary',
    icon: CheckCircle,
    description: 'Congratulations! Your identity has been successfully verified.'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-destructive/10 text-destructive',
    icon: XCircle,
    description: 'Your application was not approved. Please review the reason below.'
  }
};

export default function VerificationStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/verification/status');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchStatus = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/verification/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Status fetch error:', err);
      setError('Unable to fetch verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token]);

  // Auto refresh status every 30 seconds for pending statuses
  useEffect(() => {
    if (status && ['submitted', 'under_automated_verification', 'under_officer_review'].includes(status.status)) {
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading verification status...</p>
        </div>
      </div>
    );
  }

  const currentStatus = status?.status || 'not_started';
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Alert */}
          {showSuccess && (
            <Alert className="mb-6 border-secondary/50 bg-secondary/10">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <AlertTitle className="text-secondary">Submission Successful</AlertTitle>
              <AlertDescription>
                Your verification application has been submitted successfully.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Status Card */}
          <Card className="border-border mb-6">
            <CardHeader className="text-center pb-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.color.split(' ')[0]} mx-auto mb-4`}>
                <StatusIcon className={`h-8 w-8 ${config.color.split(' ').slice(1).join(' ')}`} />
              </div>
              <CardTitle className="text-xl">Application Status</CardTitle>
              <div className="mt-2">
                <Badge className={config.color}>
                  {config.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">{config.description}</p>
              
              {status?.submittedAt && (
                <p className="text-sm text-muted-foreground mt-4">
                  Submitted on: {new Date(status.submittedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Next Step Card */}
          {status?.nextStep && (
            <Card className="border-border mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  Next Step
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{status.nextStep}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {currentStatus === 'rejected' && status?.rejectionReason && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Reason for Rejection</AlertTitle>
              <AlertDescription>{status.rejectionReason}</AlertDescription>
            </Alert>
          )}

          {/* Status History */}
          {status?.statusHistory && status.statusHistory.length > 0 && (
            <Card className="border-border mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
                <CardDescription>Track your application progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {status.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {statusConfig[history.status]?.label || history.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(history.changedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {history.remarks && (
                          <p className="text-sm text-muted-foreground mt-1">{history.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentStatus === 'not_started' && (
              <Button 
                onClick={() => router.push('/verification/form')}
                className="bg-primary hover:bg-primary/90"
              >
                Start Verification
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {currentStatus === 'rejected' && (
              <Button 
                onClick={() => router.push('/verification/form')}
                className="bg-primary hover:bg-primary/90"
              >
                Resubmit Application
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {['submitted', 'under_automated_verification', 'under_officer_review'].includes(currentStatus) && (
              <Button 
                variant="outline"
                onClick={fetchStatus}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}