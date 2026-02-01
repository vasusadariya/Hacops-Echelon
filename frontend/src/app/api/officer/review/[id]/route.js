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
  MapPin, Phone, Loader2, Shield, Clock, Image,
  Bot, Keyboard, MousePointer2, Clipboard, Activity, Eye, EyeOff,
  Cpu, Fingerprint, ScanFace, FileCheck, FileWarning, Timer, Brain
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
  
  const [showBehavioralDetails, setShowBehavioralDetails] = useState(false);
  const [showAIDetails, setShowAIDetails] = useState(false);

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

  // Helper functions
  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBgColor = (level) => {
    switch (level?.toLowerCase()) {
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

  const getDecisionBadge = (decision) => {
    switch (decision?.toUpperCase()) {
      case 'PASS':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />PASS</Badge>;
      case 'FAIL':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />FAIL</Badge>;
      case 'REVIEW':
        return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="h-3 w-3 mr-1" />REVIEW</Badge>;
      case 'SUSPECT':
        return <Badge className="bg-red-600 text-white"><AlertTriangle className="h-3 w-3 mr-1" />SUSPECT</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">PENDING</Badge>;
    }
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
  
  // Get behavioral data
  const behaviorSummary = app?.behaviorSummary || {};
  const detailedBehavioral = app?.detailedBehavioralAnalysis || null;
  const legacyBehavior = app?.behaviorAnalysis || {};
  
  // Get AI verification results
  const aiResults = app?.aiVerificationResults || null;
  const overallAssessment = aiResults?.overallAssessment || {};
  
  // Calculate scores with fallback chain
  const botLikelihood = behaviorSummary.botLikelihood ?? legacyBehavior.riskScore ?? 0;
  const overallTrustScore = behaviorSummary.overallTrustScore ?? (100 - botLikelihood);
  const riskLevel = overallAssessment.riskLevel?.toLowerCase() || behaviorSummary.riskLevel || (botLikelihood >= 70 ? 'high' : botLikelihood >= 40 ? 'medium' : 'low');
  const isHuman = behaviorSummary.isHuman ?? !legacyBehavior.suspiciousActivity ?? true;
  const recommendation = behaviorSummary.recommendation || 'standard_flow';
  
  const riskScore = overallAssessment.totalScore || legacyBehavior.riskScore || botLikelihood;
  
  const isAlreadyReviewed = ['approved', 'rejected'].includes(app?.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={isHuman ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {isHuman ? (
              <><User className="h-3 w-3 mr-1" /> Human</>
            ) : (
              <><Bot className="h-3 w-3 mr-1" /> Bot Suspected</>
            )}
          </Badge>
          <Badge className={getRiskColor(riskLevel) + ' text-white'}>
            {riskLevel.toUpperCase()} RISK
          </Badge>
          <Badge className={
            app?.status === 'approved' ? 'bg-green-500' :
            app?.status === 'rejected' ? 'bg-red-500' :
            'bg-orange-500'
          }>
            {app?.status?.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
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
                  <ScanFace className="h-5 w-5 text-orange-500" /> Face Captures
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

          {/* ============ AI VERIFICATION RESULTS CARD ============ */}
          {aiResults && (
            <Card className={`border-2 ${getRiskBgColor(overallAssessment.riskLevel)}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Verification Results
                  </div>
                  <Badge className={getRiskColor(overallAssessment.riskLevel) + ' text-white'}>
                    {overallAssessment.riskLevel || 'PENDING'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Automated ML model analysis • Score: {overallAssessment.totalScore || 0}/100
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Score */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border text-center">
                    <div className="text-3xl font-bold text-purple-600">{overallAssessment.totalScore || 0}</div>
                    <div className="text-xs text-gray-500">Total Score</div>
                    <Progress value={overallAssessment.totalScore || 0} className="h-2 mt-2" />
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-center">
                    <div className="text-2xl font-bold text-green-600">{overallAssessment.passedChecks || 0}</div>
                    <div className="text-xs text-gray-500">Passed</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-center">
                    <div className="text-2xl font-bold text-red-600">{overallAssessment.failedChecks || 0}</div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </div>
                </div>

                {/* Toggle Details */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowAIDetails(!showAIDetails)}
                >
                  {showAIDetails ? (
                    <><EyeOff className="h-4 w-4 mr-2" /> Hide AI Details</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-2" /> View AI Details</>
                  )}
                </Button>

                {showAIDetails && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Face Verification */}
                    {aiResults.faceVerification && (
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ScanFace className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm">Face Verification (Deepfake Detection)</span>
                          </div>
                          {getDecisionBadge(aiResults.faceVerification.decision)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-gray-500">Real Prob.</div>
                            <div className="font-bold text-green-600">
                              {((aiResults.faceVerification.realProbability || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-gray-500">Fake Prob.</div>
                            <div className="font-bold text-red-600">
                              {((aiResults.faceVerification.fakeProbability || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-gray-500">Frames</div>
                            <div className="font-bold">{aiResults.faceVerification.numFrames || 0}</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Model: {aiResults.faceVerification.model}</p>
                      </div>
                    )}

                    {/* Manipulation Detection */}
                    {aiResults.manipulationDetection && (
                      <div className="grid grid-cols-2 gap-3">
                        {/* PAN Card */}
                        <div className="p-3 bg-white rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileCheck className="h-4 w-4 text-purple-500" />
                              <span className="font-medium text-sm">PAN Card</span>
                            </div>
                            {getDecisionBadge(aiResults.manipulationDetection.panCard?.decision)}
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Prediction:</span>
                              <span className={aiResults.manipulationDetection.panCard?.isAuthentic ? 'text-green-600' : 'text-red-600'}>
                                {aiResults.manipulationDetection.panCard?.prediction || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Confidence:</span>
                              <span>{((aiResults.manipulationDetection.panCard?.confidence || 0) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Aadhaar Card */}
                        <div className="p-3 bg-white rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Fingerprint className="h-4 w-4 text-orange-500" />
                              <span className="font-medium text-sm">Aadhaar Card</span>
                            </div>
                            {getDecisionBadge(aiResults.manipulationDetection.aadhaarCard?.decision)}
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Prediction:</span>
                              <span className={aiResults.manipulationDetection.aadhaarCard?.isAuthentic ? 'text-green-600' : 'text-red-600'}>
                                {aiResults.manipulationDetection.aadhaarCard?.prediction || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Confidence:</span>
                              <span>{((aiResults.manipulationDetection.aadhaarCard?.confidence || 0) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OCR Results */}
                    {(aiResults.panCardOCR || aiResults.aadhaarCardOCR) && (
                      <div className="grid grid-cols-2 gap-3">
                        {aiResults.panCardOCR && (
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-sm">PAN OCR</span>
                              {aiResults.panCardOCR.detected ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">Detected</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 text-xs">Not Detected</Badge>
                              )}
                            </div>
                            {aiResults.panCardOCR.extractedData && (
                              <div className="text-xs space-y-1">
                                {aiResults.panCardOCR.extractedData.panNumber && (
                                  <div><span className="text-gray-500">PAN:</span> {aiResults.panCardOCR.extractedData.panNumber}</div>
                                )}
                                {aiResults.panCardOCR.extractedData.name && (
                                  <div><span className="text-gray-500">Name:</span> {aiResults.panCardOCR.extractedData.name}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {aiResults.aadhaarCardOCR && (
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-orange-500" />
                              <span className="font-medium text-sm">Aadhaar OCR</span>
                              {aiResults.aadhaarCardOCR.detected ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">Detected</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 text-xs">Not Detected</Badge>
                              )}
                            </div>
                            {aiResults.aadhaarCardOCR.extractedData && (
                              <div className="text-xs space-y-1">
                                {aiResults.aadhaarCardOCR.extractedData.aadhaarNumber && (
                                  <div><span className="text-gray-500">Aadhaar:</span> {aiResults.aadhaarCardOCR.extractedData.aadhaarNumber}</div>
                                )}
                                {aiResults.aadhaarCardOCR.extractedData.name && (
                                  <div><span className="text-gray-500">Name:</span> {aiResults.aadhaarCardOCR.extractedData.name}</div>
                                )}
                                {aiResults.aadhaarCardOCR.extractedData.gender && (
                                  <div><span className="text-gray-500">Gender:</span> {aiResults.aadhaarCardOCR.extractedData.gender}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Processing Time */}
                    {aiResults.processingTime && (
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">Processing Time</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-bold">{((aiResults.processingTime.total || 0) / 1000).toFixed(1)}s</div>
                            <div className="text-gray-500">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{((aiResults.processingTime.faceVerification || 0) / 1000).toFixed(1)}s</div>
                            <div className="text-gray-500">Face</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{((aiResults.processingTime.panOCR || 0) / 1000).toFixed(1)}s</div>
                            <div className="text-gray-500">PAN</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{((aiResults.processingTime.aadhaarOCR || 0) / 1000).toFixed(1)}s</div>
                            <div className="text-gray-500">Aadhaar</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{((aiResults.processingTime.manipulationCheck || 0) / 1000).toFixed(1)}s</div>
                            <div className="text-gray-500">Manip.</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Issues & Recommendations */}
                    {overallAssessment.issues?.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-medium text-sm text-red-700 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> Issues Detected ({overallAssessment.issues.length})
                        </p>
                        <ul className="text-xs text-red-600 space-y-1">
                          {overallAssessment.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {overallAssessment.recommendations?.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-medium text-sm text-blue-700 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Recommendations
                        </p>
                        <ul className="text-xs text-blue-600 space-y-1">
                          {overallAssessment.recommendations.map((rec, i) => (
                            <li key={i}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Behavioral Analysis Card */}
          <Card className={`border-2 ${getRiskBgColor(riskLevel)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Behavioral Analysis
                </div>
                <Badge className={getRiskColor(riskLevel) + ' text-white text-xs'}>
                  {riskLevel.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                AI-powered bot detection & behavior verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Main Scores */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded border text-center">
                  <div className="text-xs text-gray-500">Trust Score</div>
                  <div className={`text-xl font-bold ${getScoreColor(overallTrustScore)}`}>
                    {overallTrustScore}
                  </div>
                  <Progress value={overallTrustScore} className="h-1 mt-1" />
                </div>
                <div className="p-2 bg-white rounded border text-center">
                  <div className="text-xs text-gray-500">Bot Likelihood</div>
                  <div className={`text-xl font-bold ${
                    botLikelihood < 30 ? 'text-green-600' : 
                    botLikelihood < 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {botLikelihood}%
                  </div>
                  <Progress 
                    value={botLikelihood} 
                    className={`h-1 mt-1 ${botLikelihood > 50 ? '[&>div]:bg-red-500' : ''}`}
                  />
                </div>
              </div>

              {/* Human/Bot Verdict */}
              <div className={`p-2 rounded border text-center ${isHuman ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-center gap-2">
                  {isHuman ? (
                    <><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-green-700 font-medium text-sm">Human Verified</span></>
                  ) : (
                    <><Bot className="h-4 w-4 text-red-600" /><span className="text-red-700 font-medium text-sm">Bot Suspected</span></>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommendation: {recommendation.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Toggle Details Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setShowBehavioralDetails(!showBehavioralDetails)}
              >
                {showBehavioralDetails ? (
                  <><EyeOff className="h-3 w-3 mr-1" /> Hide Details</>
                ) : (
                  <><Eye className="h-3 w-3 mr-1" /> View Details</>
                )}
              </Button>

              {/* Detailed Analysis (Collapsible) */}
              {showBehavioralDetails && detailedBehavioral && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Keyboard className="h-3 w-3" /> Keystroke
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.keystrokeAnalysis?.trustScore || 
                         detailedBehavioral?.componentScores?.typing || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MousePointer2 className="h-3 w-3" /> Mouse
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.mouseAnalysis?.trustScore || 
                         detailedBehavioral?.componentScores?.mouse || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clipboard className="h-3 w-3" /> Paste
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.pasteAnalysis?.trustScore || 
                         detailedBehavioral?.componentScores?.paste || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" /> Speed
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.speedAnalysis?.trustScore || 
                         detailedBehavioral?.componentScores?.speed || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {detailedBehavioral?.flagsDetected?.length > 0 && (
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-xs text-red-700 font-medium mb-1">
                        ⚠️ Flags ({detailedBehavioral.flagsDetected.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {detailedBehavioral.flagsDetected.map((flag, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs py-0 px-1">
                            {flag.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Assessment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" /> Overall Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-center p-4 rounded-lg ${
                riskScore >= 70 ? 'bg-green-50' :
                riskScore >= 40 ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <p className="text-4xl font-bold">{riskScore}</p>
                <p className="text-sm text-gray-500">/100 AI Score</p>
              </div>
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
              {aiResults?.startedAt && (
                <p><strong>AI Started:</strong> {new Date(aiResults.startedAt).toLocaleString()}</p>
              )}
              {aiResults?.completedAt && (
                <p><strong>AI Completed:</strong> {new Date(aiResults.completedAt).toLocaleString()}</p>
              )}
              {app?.reviewedAt && (
                <p><strong>Reviewed:</strong> {new Date(app.reviewedAt).toLocaleString()}</p>
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