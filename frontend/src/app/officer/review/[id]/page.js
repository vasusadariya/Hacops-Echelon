'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, FileText,
  MapPin, Phone, Loader2, Shield, Clock, Image
} from 'lucide-react';

export default function ReviewApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id;
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching application:', applicationId);
      
      const res = await fetch(`/api/officer/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Application not found');
      }

      const data = await res.json();
      console.log('Application data:', data);
      setApplication(data);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const appId = application._id?.toString() || applicationId;
      
      const res = await fetch(`/api/officer/applications/${appId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve', remarks: '' })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve');
      }

      setSuccess('Application approved successfully!');
      setTimeout(() => router.push('/officer/pending'), 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const appId = application._id?.toString() || applicationId;
      
      const res = await fetch(`/api/officer/applications/${appId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject', remarks: rejectionReason })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject');
      }

      setSuccess('Application rejected successfully!');
      setTimeout(() => router.push('/officer/pending'), 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  // Helper functions for behavioral analysis display
  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBgColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-50 border-green-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Application</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <p className="text-xs text-gray-400 mb-4">ID: {applicationId}</p>
            <Link href="/officer/pending">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pending
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const app = application;
  const riskScore = app?.behaviorAnalysis?.riskScore || app?.aiAnalysis?.overallRiskScore || 0;
  const isAlreadyReviewed = ['approved', 'rejected'].includes(app?.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/officer/pending">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Application Review</h1>
            <p className="text-sm text-gray-500">ID: {app?._id?.toString().slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <Badge className={
          app?.status === 'approved' ? 'bg-green-500' :
          app?.status === 'rejected' ? 'bg-red-500' :
          'bg-orange-500'
        }>
          {app?.status?.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Messages */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <XCircle className="h-5 w-5" /> Reject Application
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <Textarea
                placeholder="Rejection reason (required)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{app?.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium capitalize">{app?.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Document ID</p>
                <p className="font-mono">{app?.documentIdNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mobile</p>
                <p className="font-mono">+91 {app?.mobileNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" /> Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{app?.addressLine1}</p>
              {app?.addressLine2 && <p>{app?.addressLine2}</p>}
              <p>{app?.city}, {app?.taluka}, {app?.district}</p>
              <p>{app?.state} - {app?.pincode}</p>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Aadhaar Card</p>
                {app?.aadhaarCardImage?.secureUrl ? (
                  <a href={app.aadhaarCardImage.secureUrl} target="_blank" rel="noopener noreferrer">
                    <img src={app.aadhaarCardImage.secureUrl} alt="Aadhaar" className="w-full h-40 object-cover rounded border hover:opacity-80" />
                  </a>
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    <Image className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">PAN Card</p>
                {app?.panCardImage?.secureUrl ? (
                  <a href={app.panCardImage.secureUrl} target="_blank" rel="noopener noreferrer">
                    <img src={app.panCardImage.secureUrl} alt="PAN" className="w-full h-40 object-cover rounded border hover:opacity-80" />
                  </a>
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    <Image className="h-8 w-8" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selfies */}
          {app?.biometricSelfies && Object.keys(app.biometricSelfies).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" /> Face Captures
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4">
                {['front', 'left', 'right', 'up'].map(angle => (
                  <div key={angle}>
                    <p className="text-xs text-gray-500 mb-1 capitalize">{angle}</p>
                    {app.biometricSelfies[angle]?.secureUrl ? (
                      <a href={app.biometricSelfies[angle].secureUrl} target="_blank" rel="noopener noreferrer">
                        <img src={app.biometricSelfies[angle].secureUrl} alt={angle} className="w-full h-24 object-cover rounded border hover:opacity-80" />
                      </a>
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" /> Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-center p-4 rounded-lg ${
                riskScore >= 70 ? 'bg-red-50' :
                riskScore >= 40 ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                <p className="text-4xl font-bold">{riskScore}</p>
                <p className="text-sm text-gray-500">/100 Risk Score</p>
              </div>
              
              {app?.aiAnalysis?.allIssues?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Issues Detected:</p>
                  {app.aiAnalysis.allIssues.map((issue, i) => (
                    <p key={i} className="text-sm text-orange-600 bg-orange-50 p-2 rounded">• {issue}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Submitted:</strong> {app?.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A'}</p>
              {app?.reviewedAt && (
                <p><strong>Reviewed:</strong> {new Date(app.reviewedAt).toLocaleString()}</p>
              )}
              {app?.reviewedByName && (
                <p><strong>Reviewed By:</strong> {app.reviewedByName}</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!isAlreadyReviewed && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve Application
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject Application
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Already Reviewed */}
          {isAlreadyReviewed && (
            <Card className={app?.status === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="p-4 text-center">
                {app?.status === 'approved' ? (
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                )}
                <p className="font-semibold">Application {app?.status}</p>
                {app?.rejectionReason && (
                  <p className="text-sm mt-2">Reason: {app.rejectionReason}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}