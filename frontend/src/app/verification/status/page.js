'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Cpu,
  UserCheck,
  Loader2,
  RefreshCw,
  Home,
  ArrowRight,
  FileText,
  ChevronRight
} from 'lucide-react';

const statusIcons = {
  'not_started': FileText,
  'draft': FileText,
  'submitted': Clock,
  'under_automated_verification': Cpu,
  'under_officer_review': UserCheck,
  'approved': CheckCircle,
  'rejected': XCircle
};

const statusColors = {
  'not_started': 'bg-gray-100 text-gray-700 border-gray-300',
  'draft': 'bg-gray-100 text-gray-700 border-gray-300',
  'submitted': 'bg-blue-100 text-blue-700 border-blue-300',
  'under_automated_verification': 'bg-purple-100 text-purple-700 border-purple-300',
  'under_officer_review': 'bg-orange-100 text-orange-700 border-orange-300',
  'approved': 'bg-green-100 text-green-700 border-green-300',
  'rejected': 'bg-red-100 text-red-700 border-red-300'
};

export default function VerificationStatusPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/verification/status');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    }
  }, [isAuthenticated]);

  // Auto-refresh for pending statuses
  useEffect(() => {
    if (status?.isPending) {
      const interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [status?.isPending, status?.status]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/verification/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError('');
      } else {
        throw new Error('Failed to fetch status');
      }
    } catch (err) {
      setError('Unable to fetch verification status');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading verification status...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const StatusIcon = statusIcons[status?.status] || Clock;
  const statusColor = statusColors[status?.status] || statusColors['not_started'];

  // Progress steps
  const steps = [
    { id: 'submitted', label: 'Submitted', icon: Clock },
    { id: 'under_automated_verification', label: 'AI Verification', icon: Cpu },
    { id: 'under_officer_review', label: 'Officer Review', icon: UserCheck },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  const getCurrentStep = () => {
    switch (status?.status) {
      case 'submitted': return 1;
      case 'under_automated_verification': return 2;
      case 'under_officer_review': return 3;
      case 'approved':
      case 'rejected': return 4;
      default: return 0;
    }
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Verification Status</h1>
          <p className="text-gray-500">Track your identity verification progress</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {status?.hasVerification && currentStep > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index < currentStep;
                  const isCurrent = index === currentStep - 1;
                  const isRejected = status?.status === 'rejected' && index === 3;
                  
                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isRejected ? 'bg-red-500 text-white' :
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-primary text-white animate-pulse' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <span className={`text-xs mt-1 text-center ${
                          isCompleted || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 ${
                          index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Status Card */}
        <Card className={`border-2 ${statusColor} mb-6`}>
          <CardContent className="p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              status?.isVerified ? 'bg-green-200' :
              status?.isRejected ? 'bg-red-200' :
              status?.isPending ? 'bg-orange-200' : 'bg-gray-200'
            }`}>
              <StatusIcon className={`h-10 w-10 ${
                status?.isVerified ? 'text-green-600' :
                status?.isRejected ? 'text-red-600' :
                status?.isPending ? 'text-orange-600' : 'text-gray-600'
              }`} />
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {status?.statusInfo?.title || 'Not Started'}
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              {status?.statusInfo?.message || 'Start your verification to access services.'}
            </p>

            {status?.isPending && (
              <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Auto-refreshing every 5 seconds</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rejection Reason */}
        {status?.isRejected && status?.rejectionReason && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Rejection Reason</AlertTitle>
            <AlertDescription>{status.rejectionReason}</AlertDescription>
          </Alert>
        )}

        {/* Approved Message */}
        {status?.isVerified && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Identity Verified!</AlertTitle>
            <AlertDescription className="text-green-600">
              Your identity has been verified. You now have full access to all services.
              {status.reviewedByName && ` Verified by: ${status.reviewedByName}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Application Details */}
        {status?.hasVerification && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Application ID</span>
                <span className="font-mono font-medium">{status.verificationId?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{status.fullName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Current Status</span>
                <Badge className={statusColor}>{status.statusInfo?.title}</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Submitted</span>
                <span>{status.submittedAt ? new Date(status.submittedAt).toLocaleString('en-IN') : '-'}</span>
              </div>
              {status.reviewedAt && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Reviewed</span>
                  <span>{new Date(status.reviewedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
              {status.aiAnalysis && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">AI Risk Assessment</span>
                  <Badge className={
                    status.aiAnalysis.riskScore >= 70 ? 'bg-red-100 text-red-700' :
                    status.aiAnalysis.riskScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }>
                    {status.aiAnalysis.recommendation} ({status.aiAnalysis.riskScore}/100)
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        {status?.statusHistory?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...status.statusHistory].reverse().map((history, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        idx === 0 ? 'bg-primary' : 'bg-gray-300'
                      }`} />
                      {idx < status.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-gray-800">
                        {history.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(history.changedAt).toLocaleString('en-IN')}
                      </p>
                      {history.remarks && (
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                          {history.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!status?.hasVerification && (
            <Link href="/verification/form">
              <Button className="w-full sm:w-auto">
                Start Verification <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}

          {status?.canResubmit && (
            <Link href="/verification/form">
              <Button className="w-full sm:w-auto">
                Resubmit Application <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}

          <Button variant="outline" onClick={fetchStatus} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>

          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}