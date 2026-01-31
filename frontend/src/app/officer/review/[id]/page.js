'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  FileText,
  MapPin,
  Phone,
  Camera,   
  Loader2,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Shield
} from 'lucide-react';

export default function ApplicationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

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
      const res = await fetch(`/api/officer/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Application not found');
      }

      const data = await res.json();
      setApplication(data);
    } catch (err) {
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/officer/applications/${applicationId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          remarks: action === 'reject' ? rejectionReason : remarks
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }

      router.push('/officer/pending');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
      setShowConfirm(null);
    }
  };

  const faceAngles = [
    { id: 'front', label: 'Front', icon: User },
    { id: 'left', label: 'Left', icon: ChevronLeft },
    { id: 'right', label: 'Right', icon: ChevronRight },
    { id: 'up', label: 'Up', icon: ChevronUp }
  ];

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
            <Link href="/officer/pending">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pending
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskScore = application?.behaviorAnalysis?.riskScore || 0;
  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const isAlreadyReviewed = ['approved', 'rejected'].includes(application?.status);

  return (
    <div className="space-y-6">
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full">
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

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {showConfirm === 'approve' ? (
                  <><CheckCircle className="h-5 w-5 text-green-600" /> Confirm Approval</>
                ) : (
                  <><XCircle className="h-5 w-5 text-red-600" /> Confirm Rejection</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showConfirm === 'reject' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rejection Reason (Required)</Label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              {showConfirm === 'approve' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Remarks (Optional)</Label>
                  <Textarea
                    placeholder="Add any remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAction(showConfirm)}
                  disabled={actionLoading || (showConfirm === 'reject' && !rejectionReason.trim())}
                  className={showConfirm === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : showConfirm === 'approve' ? (
                    'Approve Application'
                  ) : (
                    'Reject Application'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/officer/pending">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Application Review</h1>
            <p className="text-sm text-gray-500 font-mono">
              ID: {application?._id?.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={
            application?.status === 'approved' ? 'bg-green-100 text-green-700' :
            application?.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }>
            {application?.status?.replace(/_/g, ' ').toUpperCase()}
          </Badge>
          <Badge className={
            riskLevel === 'high' ? 'bg-red-100 text-red-700' :
            riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }>
            Risk: {riskScore}/100
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Application Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Full Name</p>
                  <p className="font-medium text-gray-900">{application?.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Gender</p>
                  <p className="font-medium capitalize">{application?.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Document ID</p>
                  <p className="font-mono text-sm">{application?.documentIdNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Mobile</p>
                  <p className="font-mono text-sm">+91 {application?.mobileNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-green-600" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-1 text-sm">
                <p className="text-gray-900">{application?.addressLine1}</p>
                {application?.addressLine2 && <p className="text-gray-700">{application.addressLine2}</p>}
                <p className="text-gray-700">
                  {application?.city}, {application?.taluka}, {application?.district}
                </p>
                <p className="text-gray-700">
                  {application?.state} - <span className="font-mono">{application?.pincode}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Document Images */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-purple-600" />
                Document Images
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Aadhaar Card</p>
                  {application?.aadhaarCardImage?.secureUrl ? (
                    <div 
                      className="relative aspect-4/3 rounded-lg overflow-hidden border-2 cursor-pointer group hover:border-orange-400"
                      onClick={() => setPreviewImage({ 
                        url: application.aadhaarCardImage.secureUrl, 
                        label: 'Aadhaar Card' 
                      })}
                    >
                      <img 
                        src={application.aadhaarCardImage.secureUrl} 
                        alt="Aadhaar" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-4/3 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      Not uploaded
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">PAN Card</p>
                  {application?.panCardImage?.secureUrl ? (
                    <div 
                      className="relative aspect-4/3 rounded-lg overflow-hidden border-2 cursor-pointer group hover:border-orange-400"
                      onClick={() => setPreviewImage({ 
                        url: application.panCardImage.secureUrl, 
                        label: 'PAN Card' 
                      })}
                    >
                      <img 
                        src={application.panCardImage.secureUrl} 
                        alt="PAN" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-4/3 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      Not uploaded
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biometric Selfies */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-5 w-5 text-orange-600" />
                Biometric Face Verification (4 Angles)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {faceAngles.map(({ id, label, icon: Icon }) => {
                  const selfie = application?.biometricSelfies?.[id];
                  return (
                    <div key={id}>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Icon className="h-4 w-4 text-gray-500" /> {label}
                      </p>
                      {selfie?.secureUrl ? (
                        <div 
                          className="relative aspect-3/4 rounded-lg overflow-hidden border-2 cursor-pointer group hover:border-orange-400"
                          onClick={() => setPreviewImage({ url: selfie.secureUrl, label: `${label} View` })}
                        >
                          <img 
                            src={selfie.secureUrl} 
                            alt={`${label} view`} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-3/4 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          Not captured
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Fallback for single selfie */}
              {!application?.biometricSelfies?.front && application?.biometricSelfie?.secureUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Single Selfie (Legacy)</p>
                  <div 
                    className="w-32 h-40 rounded-lg overflow-hidden border cursor-pointer"
                    onClick={() => setPreviewImage({ 
                      url: application.biometricSelfie.secureUrl, 
                      label: 'Selfie' 
                    })}
                  >
                    <img 
                      src={application.biometricSelfie.secureUrl} 
                      alt="Selfie" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Risk Indicators & Actions */}
        <div className="space-y-6">
          {/* Risk Assessment */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-red-600" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Risk Score */}
              <div className={`p-4 rounded-lg ${
                riskLevel === 'high' ? 'bg-red-50' :
                riskLevel === 'medium' ? 'bg-yellow-50' :
                'bg-green-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Risk Score</span>
                  <span className={`text-2xl font-bold ${
                    riskLevel === 'high' ? 'text-red-600' :
                    riskLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {riskScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      riskLevel === 'high' ? 'bg-red-500' :
                      riskLevel === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>

              {/* Risk Indicators */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Risk Indicators</p>
                
                <div className={`p-3 rounded-lg ${
                  riskScore >= 50 ? 'bg-yellow-50' : 'bg-green-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{riskScore >= 50 ? '⚠️' : '✓'}</span>
                    <span className={`font-medium ${
                      riskScore >= 50 ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      Behavioral Analysis
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {riskScore >= 50 ? 'Unusual behavior patterns detected' : 'Normal behavior patterns'}
                  </p>
                </div>

                <div className={`p-3 rounded-lg ${
                  application?.behaviorAnalysis?.suspiciousActivity ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {application?.behaviorAnalysis?.suspiciousActivity ? '❗' : '✓'}
                    </span>
                    <span className={`font-medium ${
                      application?.behaviorAnalysis?.suspiciousActivity ? 'text-red-700' : 'text-green-700'
                    }`}>
                      Suspicious Activity
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {application?.behaviorAnalysis?.suspiciousActivity 
                      ? 'Potential fraud indicators present' 
                      : 'No suspicious activity detected'
                    }
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <span className="font-medium text-blue-700">Document Consistency</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Documents uploaded and ready for manual verification
                  </p>
                </div>
              </div>

              {/* Behavior Details */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3">Behavior Metrics</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Typing Speed</span>
                    <span className="font-mono">{application?.behaviorAnalysis?.typingSpeed || 0} cpm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mouse Movements</span>
                    <span className="font-mono">{application?.behaviorAnalysis?.mouseMovements || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time Spent</span>
                    <span className="font-mono">{application?.behaviorAnalysis?.totalTimeSpent || 0}s</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!isAlreadyReviewed && (
            <Card className="border shadow-sm">
              <CardHeader className="bg-gray-50 border-b py-4">
                <CardTitle className="text-base">Officer Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowConfirm('approve')}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Application
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowConfirm('reject')}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Already Reviewed Info */}
          {isAlreadyReviewed && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className={`p-4 rounded-lg ${
                  application?.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {application?.status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      application?.status === 'approved' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Application {application?.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                  {application?.reviewedAt && (
                    <p className="text-sm text-gray-600">
                      Reviewed on: {new Date(application.reviewedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  {application?.rejectionReason && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700">Rejection Reason:</p>
                      <p className="text-sm text-gray-600 mt-1">{application.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Info */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50 border-b py-3">
              <CardTitle className="text-sm">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted</span>
                <span>
                  {application?.submittedAt 
                    ? new Date(application.submittedAt).toLocaleDateString('en-IN')
                    : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span>{application?.city}, {application?.state}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}