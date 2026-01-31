'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ArrowRight,
  User,
  FileCheck,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp
} from 'lucide-react';
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
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    description: 'Congratulations! Your identity has been successfully verified.'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
    description: 'Your application was not approved. Please review the reason below.'
  }
};

const faceAngles = [
  { id: 'front', label: 'Front', icon: User },
  { id: 'left', label: 'Left', icon: ChevronLeft },
  { id: 'right', label: 'Right', icon: ChevronRight },
  { id: 'up', label: 'Up', icon: ChevronUp }
];

export default function VerificationStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/verification/status', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch status');
      
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
    if (token || localStorage.getItem('token')) {
      fetchStatus();
    }
  }, [token]);

  // Auto refresh for pending statuses
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img src={previewImage.url} alt={previewImage.label} className="w-full rounded-lg" />
            <p className="text-center text-white mt-4">{previewImage.label}</p>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Alert */}
          {showSuccess && (
            <Alert className="mb-6 border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Submission Successful</AlertTitle>
              <AlertDescription className="text-green-600">
                Your verification application has been submitted successfully with all 4 face photos.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* User Profile Card */}
          {status && status.status !== 'not_started' && (
            <Card className="border-border mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    {status.selfieThumbUrl ? (
                      <AvatarImage src={status.selfieThumbUrl} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-8 w-8 text-primary" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{status.fullName || 'Applicant'}</h2>
                    <p className="text-sm text-muted-foreground">
                      ID: {status.verificationId?.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Card */}
          <Card className="border-border mb-6">
            <CardHeader className="text-center pb-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.color.split(' ')[0]} mx-auto mb-4`}>
                <StatusIcon className={`h-8 w-8 ${config.color.split(' ').slice(1).join(' ')}`} />
              </div>
              <CardTitle className="text-xl">Application Status</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">{config.description}</p>
              {status?.submittedAt && (
                <p className="text-sm text-muted-foreground mt-4">
                  Submitted: {new Date(status.submittedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Face Photos Grid */}
          {status?.selfieUrls && Object.values(status.selfieUrls).some(url => url) && (
            <Card className="border-border mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Face Verification Photos
                </CardTitle>
                <CardDescription>4-angle face capture for secure verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {faceAngles.map(({ id, label, icon: Icon }) => {
                    const url = status.selfieUrls?.[id];
                    const thumbUrl = status.selfieThumbUrls?.[id];
                    const hasImage = !!url;
                    
                    return (
                      <div key={id} className="relative group">
                        <div 
                          className={`aspect-square rounded-lg overflow-hidden border-2 ${
                            hasImage ? 'border-green-500 cursor-pointer' : 'border-gray-200'
                          }`}
                          onClick={() => hasImage && setPreviewImage({ url, label: `${label} View` })}
                        >
                          {hasImage ? (
                            <img
                              src={thumbUrl || url}
                              alt={`${label} view`}
                              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Icon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-center">
                          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Icon className="h-3 w-3" />
                            {label}
                          </span>
                          {hasImage && (
                            <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-2 w-2 mr-1" />
                              Captured
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Click on any photo to view full size
                </p>
              </CardContent>
            </Card>
          )}

          {/* Documents Status */}
          {status?.documentsUploaded && (
            <Card className="border-border mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Documents Uploaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                      status.documentsUploaded.aadhaar ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {status.documentsUploaded.aadhaar ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm mt-2">Aadhaar Card</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                      status.documentsUploaded.pan ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {status.documentsUploaded.pan ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm mt-2">PAN Card</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Step */}
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
          {status?.statusHistory?.length > 0 && (
            <Card className="border-border mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {status.statusHistory.slice().reverse().map((history, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                      <div>
                        <p className="font-medium">
                          {statusConfig[history.status]?.label || history.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(history.changedAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                        {history.remarks && (
                          <p className="text-sm text-muted-foreground italic">"{history.remarks}"</p>
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
              <Button onClick={() => router.push('/verification/form')} className="bg-primary">
                Start Verification <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {currentStatus === 'rejected' && (
              <Button onClick={() => router.push('/verification/form')} className="bg-primary">
                Resubmit Application <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {['submitted', 'under_automated_verification', 'under_officer_review'].includes(currentStatus) && (
              <Button variant="outline" onClick={fetchStatus}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Status
              </Button>
            )}
            
            <Button variant="outline" onClick={() => router.push('/')}>
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}