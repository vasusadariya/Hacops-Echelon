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
  // NEW ICONS for behavioral analysis
  Bot, Keyboard, MousePointer2, Clipboard, Activity, ChevronDown, ChevronUp, Eye, EyeOff
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
  
  // NEW: State for behavioral analysis details
  const [showBehavioralDetails, setShowBehavioralDetails] = useState(false);

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
  
  // Get behavioral data - prefer new format, fall back to legacy
  const behaviorSummary = app?.behaviorSummary || {};
  const detailedBehavioral = app?.detailedBehavioralAnalysis || null;
  const legacyBehavior = app?.behaviorAnalysis || {};
  
  // Calculate scores with fallback chain
  const botLikelihood = behaviorSummary.botLikelihood ?? legacyBehavior.riskScore ?? 0;
  const overallTrustScore = behaviorSummary.overallTrustScore ?? (100 - botLikelihood);
  const riskLevel = behaviorSummary.riskLevel || (botLikelihood >= 70 ? 'high' : botLikelihood >= 40 ? 'medium' : 'low');
  const isHuman = behaviorSummary.isHuman ?? !legacyBehavior.suspiciousActivity ?? true;
  const recommendation = behaviorSummary.recommendation || 'standard_flow';
  
  // Legacy risk score for backward compatibility
  const riskScore = legacyBehavior.riskScore || botLikelihood;
  
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
          {/* Human/Bot Badge */}
          <Badge className={isHuman ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {isHuman ? (
              <><User className="h-3 w-3 mr-1" /> Human</>
            ) : (
              <><Bot className="h-3 w-3 mr-1" /> Bot Suspected</>
            )}
          </Badge>
          {/* Risk Badge */}
          <Badge className={getRiskColor(riskLevel) + ' text-white'}>
            {riskLevel.toUpperCase()} RISK
          </Badge>
          {/* Status Badge */}
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
          
          {/* ============ NEW: BEHAVIORAL ANALYSIS CARD ============ */}
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
              {showBehavioralDetails && (
                <div className="space-y-2 pt-2 border-t">
                  {/* Component Scores */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-white rounded border">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Keyboard className="h-3 w-3" /> Keystroke
                      </div>
                      <div className="font-bold text-sm">
                        {detailedBehavioral?.keystrokeAnalysis?.trustScore || 
                         detailedBehavioral?.componentScores?.typing || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {detailedBehavioral?.keystrokeAnalysis?.avgIntervalMs 
                          ? `${Math.round(detailedBehavioral.keystrokeAnalysis.avgIntervalMs)}ms`
                          : legacyBehavior.typingSpeed 
                            ? `${legacyBehavior.typingSpeed} cpm`
                            : '-'
                        }
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
                      <div className="text-xs text-gray-400">
                        {detailedBehavioral?.mouseAnalysis?.totalMovements || legacyBehavior.mouseMovements || 0} moves
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
                      <div className="text-xs text-gray-400">
                        {detailedBehavioral?.pasteAnalysis?.pastePercentage 
                          ? `${Math.round(detailedBehavioral.pasteAnalysis.pastePercentage)}% pasted`
                          : '-'
                        }
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
                      <div className="text-xs text-gray-400">
                        {detailedBehavioral?.speedAnalysis?.totalTimeSeconds || legacyBehavior.totalTimeSpent || 0}s total
                      </div>
                    </div>
                  </div>

                  {/* Flags */}
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

                  {/* Raw Metrics */}
                  {detailedBehavioral?.rawMetrics && (
                    <div className="text-xs text-gray-400 pt-1 border-t grid grid-cols-2 gap-1">
                      <span>Keys: {detailedBehavioral.rawMetrics.totalKeystrokes || 0}</span>
                      <span>Mouse: {detailedBehavioral.rawMetrics.totalMouseMovements || 0}</span>
                      <span>Fields: {detailedBehavioral.rawMetrics.totalFields || 0}</span>
                      <span>Time: {Math.round((detailedBehavioral.rawMetrics.sessionDurationMs || 0) / 1000)}s</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ============ LEGACY RISK ASSESSMENT (kept for compatibility) ============ */}
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