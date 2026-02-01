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
  Cpu, Fingerprint, ScanFace, FileCheck, Timer, Brain,
  AlertCircle, ThumbsUp, FileSearch, ChevronLeft, ChevronRight
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
  const [showAIDetails, setShowAIDetails] = useState(true);

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
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const appId = application._id?.toString() || applicationId;
      
      console.log('Approving application:', appId);
      
      const res = await fetch(`/api/officer/applications/${appId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve', remarks: '' })
      });

      const data = await res.json();
      console.log('Approve response:', data);
      
      // if (!res.ok) {
      //   throw new Error(data.error || 'Failed to approve application');
      // }

      setSuccess('Application approved successfully! Redirecting...');
      
      // Update local state
      setApplication(prev => ({ ...prev, status: 'approved' }));
      
      setTimeout(() => {
        router.push('/officer/pending');
      }, 2000);

    } catch (err) {
      console.error('Approve error:', err);
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
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const appId = application._id?.toString() || applicationId;
      
      console.log('Rejecting application:', appId);
      
      const res = await fetch(`/api/officer/applications/${appId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject', remarks: rejectionReason })
      });

      const data = await res.json();
      console.log('Reject response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      setSuccess('Application rejected successfully! Redirecting...');
      setShowRejectModal(false);
      
      // Update local state
      setApplication(prev => ({ ...prev, status: 'rejected', rejectionReason }));
      
      setTimeout(() => {
        router.push('/officer/pending');
      }, 2000);

    } catch (err) {
      console.error('Reject error:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
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
      case 'APPROVED':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />APPROVED</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />REJECTED</Badge>;
      case 'PENDING':
        return <Badge className="bg-gray-500 text-white"><Clock className="h-3 w-3 mr-1" />PENDING</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{decision || 'UNKNOWN'}</Badge>;
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
  const vr = app?.verificationResults;
  const overallAssessment = vr?.overallAssessment;
  
  const behaviorSummary = app?.behaviorSummary || {};
  const detailedBehavioral = app?.detailedBehavioralAnalysis || null;
  
  const aiScore = overallAssessment?.totalScore || 0;
  const aiRiskLevel = overallAssessment?.riskLevel || 'MEDIUM';
  const botLikelihood = behaviorSummary.botLikelihood || 0;
  const overallTrustScore = behaviorSummary.overallTrustScore || (100 - botLikelihood);
  const behaviorRiskLevel = behaviorSummary.riskLevel || 'medium';
  const isHuman = behaviorSummary.isHuman !== false;
  
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
            {isHuman ? <><User className="h-3 w-3 mr-1" /> Human</> : <><Bot className="h-3 w-3 mr-1" /> Bot Suspected</>}
          </Badge>
          <Badge className={getRiskColor(aiRiskLevel) + ' text-white'}>
            {aiRiskLevel} RISK
          </Badge>
          <Badge className={
            app?.status === 'approved' ? 'bg-green-500 text-white' :
            app?.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
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
              <p className="text-sm text-gray-600">
                You are about to reject the application for: <strong>{app?.fullName}</strong>
              </p>
              <Textarea
                placeholder="Enter rejection reason (required)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setShowRejectModal(false); setError(''); }}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject} 
                  disabled={!rejectionReason.trim() || actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ AI VERIFICATION RESULTS - FULL WIDTH AT TOP ============ */}
      {vr ? (
        <Card className={`border-2 ${getRiskBgColor(aiRiskLevel)}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI Verification Results
              </div>
              <div className="flex items-center gap-2">
                {getDecisionBadge(overallAssessment?.finalDecision)}
                <Badge className={getRiskColor(aiRiskLevel) + ' text-white'}>
                  {aiRiskLevel}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              {overallAssessment?.summary || 'Automated ML model analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-4 rounded-lg border text-center ${aiScore >= 70 ? 'bg-green-50 border-green-200' : aiScore >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-4xl font-bold ${getScoreColor(aiScore)}`}>{aiScore}</div>
                <div className="text-sm text-gray-500">Total Score</div>
                <Progress value={aiScore} className="h-2 mt-2" />
              </div>
              <div className="p-4 rounded-lg border bg-green-50 border-green-200 text-center">
                <div className="text-4xl font-bold text-green-600">{overallAssessment?.passedChecks || 0}</div>
                <div className="text-sm text-gray-500">Passed Checks</div>
              </div>
              <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-center">
                <div className="text-4xl font-bold text-red-600">{overallAssessment?.failedChecks || 0}</div>
                <div className="text-sm text-gray-500">Failed Checks</div>
              </div>
              <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200 text-center">
                <div className="text-4xl font-bold text-yellow-600">{overallAssessment?.reviewRequiredChecks || 0}</div>
                <div className="text-sm text-gray-500">Needs Review</div>
              </div>
            </div>

            {/* Toggle Details */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowAIDetails(!showAIDetails)}
            >
              {showAIDetails ? <><EyeOff className="h-4 w-4 mr-2" /> Hide Detailed AI Results</> : <><Eye className="h-4 w-4 mr-2" /> Show Detailed AI Results</>}
            </Button>

            {showAIDetails && (
              <div className="space-y-4 pt-4 border-t">
                {/* Face Verification */}
                {vr.faceVerification && (
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ScanFace className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold">Face Verification (Deepfake Detection)</span>
                      </div>
                      {getDecisionBadge(vr.faceVerification.result?.decision)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">Real Probability</div>
                        <div className="text-2xl font-bold text-green-600">
                          {((vr.faceVerification.result?.real_probability || 0) * 100).toFixed(1)}%
                        </div>
                        <Progress value={(vr.faceVerification.result?.real_probability || 0) * 100} className="h-2 mt-2 [&>div]:bg-green-500" />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">Fake Probability</div>
                        <div className="text-2xl font-bold text-red-600">
                          {((vr.faceVerification.result?.fake_probability || 0) * 100).toFixed(1)}%
                        </div>
                        <Progress value={(vr.faceVerification.result?.fake_probability || 0) * 100} className="h-2 mt-2 [&>div]:bg-red-500" />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">Frames Analyzed</div>
                        <div className="text-2xl font-bold">{vr.faceVerification.result?.num_frames || 0}</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Model: {vr.faceVerification.model}</p>
                    
                    {vr.faceVerification.faceImageUrls?.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">Analyzed Face Images:</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {vr.faceVerification.faceImageUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`Face ${i+1}`} className="h-20 w-20 object-cover rounded border hover:opacity-80 transition" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manipulation Detection */}
                {vr.manipulationDetection && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PAN Card */}
                    {vr.manipulationDetection.panCard && (
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-purple-500" />
                            <span className="font-semibold">PAN Card Authenticity</span>
                          </div>
                          {getDecisionBadge(vr.manipulationDetection.panCard.result?.decision)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Prediction:</span>
                            <span className={`font-medium ${vr.manipulationDetection.panCard.result?.is_authentic ? 'text-green-600' : 'text-red-600'}`}>
                              {vr.manipulationDetection.panCard.result?.prediction || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Is Authentic:</span>
                            <span className={vr.manipulationDetection.panCard.result?.is_authentic ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {vr.manipulationDetection.panCard.result?.is_authentic ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Confidence:</span>
                            <span>{((vr.manipulationDetection.panCard.result?.confidence || 0) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">Method: {vr.manipulationDetection.panCard.method}</p>
                      </div>
                    )}

                    {/* Aadhaar Card */}
                    {vr.manipulationDetection.aadhaarCard && (
                      <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Fingerprint className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold">Aadhaar Card Authenticity</span>
                          </div>
                          {getDecisionBadge(vr.manipulationDetection.aadhaarCard.result?.decision)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Prediction:</span>
                            <span className={`font-medium ${vr.manipulationDetection.aadhaarCard.result?.is_authentic ? 'text-green-600' : 'text-red-600'}`}>
                              {vr.manipulationDetection.aadhaarCard.result?.prediction || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Is Authentic:</span>
                            <span className={vr.manipulationDetection.aadhaarCard.result?.is_authentic ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {vr.manipulationDetection.aadhaarCard.result?.is_authentic ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Confidence:</span>
                            <span>{((vr.manipulationDetection.aadhaarCard.result?.confidence || 0) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">Method: {vr.manipulationDetection.aadhaarCard.method}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* OCR Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PAN OCR */}
                  {vr.panCardOCR && (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold">PAN Card OCR</span>
                        </div>
                        {vr.panCardOCR.result?.detected ? (
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Detected</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Not Detected</Badge>
                        )}
                      </div>
                      {vr.panCardOCR.extractedData && (
                        <div className="space-y-2 text-sm">
                          {vr.panCardOCR.extractedData.panNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">PAN Number:</span>
                              <span className="font-mono font-medium">{vr.panCardOCR.extractedData.panNumber}</span>
                            </div>
                          )}
                          {vr.panCardOCR.extractedData.name && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Name:</span>
                              <span>{vr.panCardOCR.extractedData.name}</span>
                            </div>
                          )}
                          {vr.panCardOCR.extractedData.dateOfBirth && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">DOB:</span>
                              <span>{vr.panCardOCR.extractedData.dateOfBirth}</span>
                            </div>
                          )}
                          {vr.panCardOCR.extractedData.fatherName && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Father's Name:</span>
                              <span>{vr.panCardOCR.extractedData.fatherName}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-3">Model: {vr.panCardOCR.model}</p>
                    </div>
                  )}

                  {/* Aadhaar OCR */}
                  {vr.aadhaarCardOCR && (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold">Aadhaar Card OCR</span>
                        </div>
                        {vr.aadhaarCardOCR.result?.detected ? (
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Detected</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Not Detected</Badge>
                        )}
                      </div>
                      {vr.aadhaarCardOCR.extractedData && (
                        <div className="space-y-2 text-sm">
                          {vr.aadhaarCardOCR.extractedData.aadhaarNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Aadhaar:</span>
                              <span className="font-mono font-medium">{vr.aadhaarCardOCR.extractedData.aadhaarNumber}</span>
                            </div>
                          )}
                          {vr.aadhaarCardOCR.extractedData.name && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Name:</span>
                              <span>{vr.aadhaarCardOCR.extractedData.name}</span>
                            </div>
                          )}
                          {vr.aadhaarCardOCR.extractedData.gender && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Gender:</span>
                              <span>{vr.aadhaarCardOCR.extractedData.gender}</span>
                            </div>
                          )}
                          {vr.aadhaarCardOCR.extractedData.dateOfBirth && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">DOB:</span>
                              <span>{vr.aadhaarCardOCR.extractedData.dateOfBirth}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-3">Model: {vr.aadhaarCardOCR.model}</p>
                    </div>
                  )}
                </div>

                {/* Processing Time */}
                {vr.processingTime && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold">Processing Time</span>
                    </div>
                    <div className="grid grid-cols-5 gap-3 text-center">
                      <div className="p-2 bg-white rounded border">
                        <div className="text-lg font-bold text-purple-600">{((vr.processingTime.total || 0) / 1000).toFixed(2)}s</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <div className="text-lg font-bold">{((vr.processingTime.faceVerification || 0) / 1000).toFixed(2)}s</div>
                        <div className="text-xs text-gray-500">Face</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <div className="text-lg font-bold">{((vr.processingTime.panOCR || 0) / 1000).toFixed(2)}s</div>
                        <div className="text-xs text-gray-500">PAN OCR</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <div className="text-lg font-bold">{((vr.processingTime.aadhaarOCR || 0) / 1000).toFixed(2)}s</div>
                        <div className="text-xs text-gray-500">Aadhaar</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <div className="text-lg font-bold">{((vr.processingTime.manipulationCheck || 0) / 1000).toFixed(2)}s</div>
                        <div className="text-xs text-gray-500">Manipulation</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Issues & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overallAssessment?.issues?.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-red-700">Issues Detected ({overallAssessment.issues.length})</span>
                      </div>
                      <ul className="space-y-2">
                        {overallAssessment.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {overallAssessment?.recommendations?.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-blue-700">Recommendations</span>
                      </div>
                      <ul className="space-y-2">
                        {overallAssessment.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-blue-600">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-8 text-center">
            <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No AI Verification Results</h3>
            <p className="text-sm text-gray-500 mt-2">AI verification has not been completed for this application yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info, Address, Documents, Selfies */}
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
                <FileText className="h-5 w-5 text-purple-500" /> Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Aadhaar Card</p>
                {app?.aadhaarCardImage?.secureUrl ? (
                  <a href={app.aadhaarCardImage.secureUrl} target="_blank" rel="noopener noreferrer">
                    <img src={app.aadhaarCardImage.secureUrl} alt="Aadhaar" className="w-full h-40 object-cover rounded border hover:opacity-80 transition" />
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
                    <img src={app.panCardImage.secureUrl} alt="PAN" className="w-full h-40 object-cover rounded border hover:opacity-80 transition" />
                  </a>
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    <Image className="h-8 w-8" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Face Captures */}
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
                    <p className="text-xs text-gray-500 mb-1 capitalize text-center">{angle}</p>
                    {app.biometricSelfies[angle]?.secureUrl ? (
                      <a href={app.biometricSelfies[angle].secureUrl} target="_blank" rel="noopener noreferrer">
                        <img src={app.biometricSelfies[angle].secureUrl} alt={angle} className="w-full h-24 object-cover rounded border hover:opacity-80 transition" />
                      </a>
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">N/A</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Behavioral Analysis, Navigation, Timeline, Actions */}
        <div className="space-y-6">
          {/* Behavioral Analysis Card */}
          <Card className={`border-2 ${getRiskBgColor(behaviorRiskLevel)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Behavioral Analysis
                </div>
                <Badge className={getRiskColor(behaviorRiskLevel) + ' text-white text-xs'}>
                  {behaviorRiskLevel.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded border text-center">
                  <div className="text-xs text-gray-500">Trust Score</div>
                  <div className={`text-xl font-bold ${getScoreColor(overallTrustScore)}`}>{overallTrustScore}</div>
                  <Progress value={overallTrustScore} className="h-1 mt-1" />
                </div>
                <div className="p-2 bg-white rounded border text-center">
                  <div className="text-xs text-gray-500">Bot Likelihood</div>
                  <div className={`text-xl font-bold ${botLikelihood < 30 ? 'text-green-600' : botLikelihood < 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {botLikelihood}%
                  </div>
                  <Progress value={botLikelihood} className={`h-1 mt-1 ${botLikelihood > 50 ? '[&>div]:bg-red-500' : ''}`} />
                </div>
              </div>

              <div className={`p-2 rounded border text-center ${isHuman ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {isHuman ? (
                  <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm">
                    <CheckCircle className="h-4 w-4" /> Human Verified
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-red-700 font-medium text-sm">
                    <Bot className="h-4 w-4" /> Bot Suspected
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setShowBehavioralDetails(!showBehavioralDetails)}
              >
                {showBehavioralDetails ? <><EyeOff className="h-3 w-3 mr-1" /> Hide Details</> : <><Eye className="h-3 w-3 mr-1" /> View Details</>}
              </Button>

              {showBehavioralDetails && detailedBehavioral && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Keyboard className="h-3 w-3" /> Keystroke
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.keystrokeAnalysis?.trustScore || detailedBehavioral?.componentScores?.typing || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MousePointer2 className="h-3 w-3" /> Mouse
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.mouseAnalysis?.trustScore || detailedBehavioral?.componentScores?.mouse || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clipboard className="h-3 w-3" /> Paste
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.pasteAnalysis?.trustScore || detailedBehavioral?.componentScores?.paste || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" /> Speed
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.speedAnalysis?.trustScore || detailedBehavioral?.componentScores?.speed || 'N/A'}
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

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="font-medium">Submitted</p>
                  <p className="text-xs text-gray-500">{app?.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              {vr?.startedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <div className="flex-1">
                    <p className="font-medium">AI Processing Started</p>
                    <p className="text-xs text-gray-500">{new Date(vr.startedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {vr?.completedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="font-medium">AI Processing Completed</p>
                    <p className="text-xs text-gray-500">{new Date(vr.completedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {app?.reviewedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <div className="flex-1">
                    <p className="font-medium">Officer Reviewed</p>
                    <p className="text-xs text-gray-500">{new Date(app.reviewedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!isAlreadyReviewed && (
            <Card className="border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-700">Officer Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-base" 
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                  Approve Application
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full h-12 text-base"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="h-5 w-5 mr-2" /> Reject Application
                </Button>
                                <p className="text-xs text-gray-500 text-center">
                  Your decision is final and will be communicated to the applicant.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Already Reviewed Status */}
          {isAlreadyReviewed && (
            <Card className={app?.status === 'approved' ? 'border-2 border-green-300 bg-green-50' : 'border-2 border-red-300 bg-red-50'}>
              <CardContent className="p-6 text-center">
                {app?.status === 'approved' ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <p className="text-xl font-bold text-green-700">Application Approved</p>
                    <p className="text-sm text-green-600 mt-2">This application has been verified and approved.</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                    <p className="text-xl font-bold text-red-700">Application Rejected</p>
                    {app?.rejectionReason && (
                      <div className="mt-3 p-3 bg-white rounded border border-red-200 text-left">
                        <p className="text-xs text-gray-500 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-600">{app.rejectionReason}</p>
                      </div>
                    )}
                  </>
                )}
                {app?.reviewedAt && (
                  <p className="text-xs text-gray-500 mt-4">
                    Reviewed on {new Date(app.reviewedAt).toLocaleString()}
                  </p>
                )}
                {app?.reviewedByName && (
                  <p className="text-xs text-gray-500">
                    By: {app.reviewedByName}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}