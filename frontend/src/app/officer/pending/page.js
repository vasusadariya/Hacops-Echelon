'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Clock, RefreshCw, Eye, CheckCircle, XCircle, AlertTriangle,
  FileText, MapPin, Phone, Loader2, ChevronDown, ChevronUp, Shield,
  Brain, ScanFace, FileCheck, Bot, Fingerprint
} from 'lucide-react';

export default function PendingApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login again');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/officer/applications?status=under_officer_review&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log('Fetched applications:', data.applications?.length);
      
      // Sort: high risk first
      const sorted = (data.applications || []).sort((a, b) => {
        if (a.isHighRisk && !b.isHighRisk) return -1;
        if (!a.isHighRisk && b.isHighRisk) return 1;
        return 0;
      });
      
      setApplications(sorted);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFullId = (app) => {
    return typeof app._id === 'object' ? app._id.toString() : app._id;
  };

  const handleApprove = async (app) => {
    const appId = getFullId(app);
    setActionLoading(appId);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
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
      setApplications(prev => prev.filter(a => getFullId(a) !== appId));
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (app) => {
    const appId = getFullId(app);
    
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionLoading(appId);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
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
      setApplications(prev => prev.filter(a => getFullId(a) !== appId));
      setShowRejectModal(null);
      setRejectionReason('');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getDecisionBadge = (decision) => {
    switch (decision?.toUpperCase()) {
      case 'PASS':
        return <Badge className="bg-green-500 text-white text-xs">PASS</Badge>;
      case 'FAIL':
        return <Badge className="bg-red-500 text-white text-xs">FAIL</Badge>;
      case 'REVIEW':
        return <Badge className="bg-yellow-500 text-white text-xs">REVIEW</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-500 text-white text-xs">APPROVED</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500 text-white text-xs">REJECTED</Badge>;
      default:
        return <Badge className="bg-gray-400 text-white text-xs">PENDING</Badge>;
    }
  };

  const rejectApp = showRejectModal ? applications.find(a => getFullId(a) === showRejectModal) : null;

  // Count high risk
  const highRiskCount = applications.filter(a => a.isHighRisk).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            Pending Review
          </h1>
          <p className="text-gray-500">
            {applications.length} applications awaiting your review
            {highRiskCount > 0 && (
              <span className="text-red-600 font-medium"> ({highRiskCount} high risk)</span>
            )}
          </p>
        </div>
        <Button onClick={fetchApplications} disabled={loading} variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* High Risk Alert */}
      {highRiskCount > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>{highRiskCount} high-risk application(s)</strong> require careful review. They are shown first in the list.
          </AlertDescription>
        </Alert>
      )}

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
      {showRejectModal && rejectApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <XCircle className="h-5 w-5" /> Reject Application
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Rejecting application for: <strong>{rejectApp.fullName}</strong>
              </p>
              <Textarea
                placeholder="Rejection reason (required)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setShowRejectModal(null); setRejectionReason(''); setError(''); }}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReject(rejectApp)} 
                  disabled={!rejectionReason.trim() || actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
            <p>Loading applications...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && applications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No Pending Applications</h3>
            <p className="text-gray-500 mt-2">All applications have been reviewed.</p>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      {!loading && applications.map((app) => {
        const appId = getFullId(app);
        const ai = app.aiVerification || {};
        const aiScore = ai.overallScore || 0;
        const botLikelihood = app.behaviorSummary?.botLikelihood || 0;
        const isHuman = app.behaviorSummary?.isHuman !== false;
        const isExpanded = expandedApp === appId;
        const isLoading = actionLoading === appId;
        const isHighRisk = app.isHighRisk;

        return (
          <Card 
            key={appId} 
            className={`border shadow-sm hover:shadow-md transition-shadow ${isHighRisk ? 'border-2 border-red-300 bg-red-50/30' : ''}`}
          >
            <CardContent className="p-4">
              {/* High Risk Badge */}
              {isHighRisk && (
                <div className="mb-3 flex items-center gap-2 text-red-700 bg-red-100 px-3 py-1.5 rounded-lg w-fit">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-semibold">HIGH RISK - Requires careful review</span>
                </div>
              )}

              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow ${isHighRisk ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                    {app.fullName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg truncate">{app.fullName}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                        #{appId.slice(-6).toUpperCase()}
                      </code>
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {app.documentIdNumber}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> +91 {app.mobileNumber}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {app.city}, {app.state}</span>
                    </div>
                  </div>
                </div>

                {/* Score Badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${aiScore >= 70 ? 'bg-green-500' : aiScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
                    <Brain className="h-3 w-3 mr-1" /> AI: {aiScore}/100
                  </Badge>
                  <Badge className={isHuman ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {isHuman ? <CheckCircle className="h-3 w-3 mr-1" /> : <Bot className="h-3 w-3 mr-1" />}
                    {isHuman ? 'Human' : `Bot ${botLikelihood}%`}
                  </Badge>
                  {getDecisionBadge(ai.decision)}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={() => handleApprove(app)} 
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowRejectModal(appId)} 
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setExpandedApp(isExpanded ? null : appId)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Link href={`/officer/review/${appId}`}>
                    <Button variant="outline"><Eye className="h-4 w-4 mr-1" /> Full Review</Button>
                  </Link>
                </div>
              </div>

              {/* AI Verification Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <p className="text-sm font-semibold">AI Verification Summary</p>
                  {ai.status === 'completed' && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Completed</Badge>
                  )}
                  {ai.riskLevel && (
                    <Badge className={`text-xs ${
                      ai.riskLevel === 'CRITICAL' || ai.riskLevel === 'HIGH' ? 'bg-red-500 text-white' :
                      ai.riskLevel === 'MEDIUM' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {ai.riskLevel}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* AI Score */}
                  <div className={`p-3 rounded-lg border text-center ${getScoreBgColor(aiScore)}`}>
                    <div className="text-xs text-gray-500 mb-1">AI Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(aiScore)}`}>{aiScore}</div>
                    <Progress value={aiScore} className="h-1.5 mt-2" />
                  </div>
                  
                  {/* Face Verification */}
                  <div className={`p-3 rounded-lg border text-center ${ai.faceDecision === 'PASS' ? 'bg-green-50 border-green-200' : ai.faceDecision === 'REVIEW' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-xs text-gray-500 mb-1">Face</div>
                    <ScanFace className={`h-5 w-5 mx-auto ${ai.faceDecision === 'PASS' ? 'text-green-600' : ai.faceDecision === 'REVIEW' ? 'text-yellow-600' : 'text-red-600'}`} />
                    <div className="text-xs font-medium mt-1">{ai.faceDecision || 'N/A'}</div>
                  </div>
                  
                  {/* PAN Verification */}
                  <div className={`p-3 rounded-lg border text-center ${ai.panCardDecision === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-xs text-gray-500 mb-1">PAN</div>
                    <FileCheck className={`h-5 w-5 mx-auto ${ai.panCardDecision === 'PASS' ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="text-xs font-medium mt-1">{ai.panCardDecision || 'N/A'}</div>
                  </div>
                  
                  {/* Aadhaar Verification */}
                  <div className={`p-3 rounded-lg border text-center ${ai.aadhaarCardDecision === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-xs text-gray-500 mb-1">Aadhaar</div>
                    <Fingerprint className={`h-5 w-5 mx-auto ${ai.aadhaarCardDecision === 'PASS' ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="text-xs font-medium mt-1">{ai.aadhaarCardDecision || 'N/A'}</div>
                  </div>
                  
                  {/* Checks Summary */}
                  <div className="p-3 rounded-lg border bg-gray-50 text-center">
                    <div className="text-xs text-gray-500 mb-1">Checks</div>
                    <div className="flex justify-center gap-2">
                      <span className="text-green-600 font-bold">{ai.passedChecks || 0}✓</span>
                      <span className="text-red-600 font-bold">{ai.failedChecks || 0}✗</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{ai.reviewRequiredChecks || 0} review</div>
                  </div>
                </div>

                {/* Issues Preview */}
                {ai.issues?.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs font-medium text-red-700 mb-1">⚠️ Issues ({ai.issues.length}):</p>
                    <p className="text-xs text-red-600 line-clamp-2">{ai.issues.slice(0, 2).join(' • ')}{ai.issues.length > 2 ? ' ...' : ''}</p>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t bg-gray-50 -mx-4 -mb-4 p-4 rounded-b">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-700">Personal Info</h4>
                      <div className="space-y-1">
                        <p><span className="text-gray-500">Name:</span> {app.fullName}</p>
                        <p><span className="text-gray-500">Gender:</span> {app.gender}</p>
                        <p><span className="text-gray-500">Document ID:</span> {app.documentIdNumber}</p>
                        <p><span className="text-gray-500">Mobile:</span> +91 {app.mobileNumber}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-700">Address</h4>
                      <div className="space-y-1 text-gray-600">
                        <p>{app.addressLine1}</p>
                        {app.addressLine2 && <p>{app.addressLine2}</p>}
                        <p>{app.city}, {app.taluka}, {app.district}</p>
                        <p>{app.state} - {app.pincode}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-700">AI Analysis</h4>
                      <div className="space-y-1">
                        <p><span className="text-gray-500">AI Score:</span> <span className={getScoreColor(aiScore)}>{aiScore}/100</span></p>
                        <p><span className="text-gray-500">AI Decision:</span> {ai.decision || 'Pending'}</p>
                        <p><span className="text-gray-500">Risk Level:</span> {ai.riskLevel || 'N/A'}</p>
                        <p><span className="text-gray-500">Bot Likelihood:</span> {botLikelihood}%</p>
                        <p><span className="text-gray-500">Submitted:</span> {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* All Issues */}
                  {ai.issues?.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-semibold text-red-700 mb-2">All Issues:</p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {ai.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {ai.recommendations?.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-semibold text-blue-700 mb-2">Recommendations:</p>
                      <ul className="text-sm text-blue-600 space-y-1">
                        {ai.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}