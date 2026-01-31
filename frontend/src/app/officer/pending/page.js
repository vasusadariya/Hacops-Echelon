'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock, RefreshCw, Eye, CheckCircle, XCircle, AlertTriangle,
  User, FileText, MapPin, Phone, Loader2, ChevronDown, ChevronUp, Shield
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
        const text = await res.text();
        throw new Error(`API Error: ${res.status} - ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      setApplications(data.applications || []);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId) => {
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve');
      }

      setSuccess('Application approved successfully!');
      setApplications(prev => prev.filter(app => app._id !== appId));
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId) => {
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject');
      }

      setSuccess('Application rejected successfully!');
      setApplications(prev => prev.filter(app => app._id !== appId));
      setShowRejectModal(null);
      setRejectionReason('');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskBadge = (score) => {
    const s = score || 0;
    if (s >= 70) return <Badge className="bg-red-500 text-white">High Risk ({s})</Badge>;
    if (s >= 40) return <Badge className="bg-yellow-500 text-white">Medium ({s})</Badge>;
    return <Badge className="bg-green-500 text-white">Low ({s})</Badge>;
  };

  const getAIFlags = (app) => {
    const flags = [];
    if (app.aiAnalysis?.documentAnomaly) flags.push({ icon: '📄', text: 'Document Anomaly' });
    if (app.aiAnalysis?.faceMismatch) flags.push({ icon: '👤', text: 'Face Mismatch' });
    if (app.aiAnalysis?.faceReuse) flags.push({ icon: '🚨', text: 'Face Reuse' });
    if (app.behaviorAnalysis?.suspiciousActivity) flags.push({ icon: '⚠️', text: 'Suspicious Activity' });
    return flags;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            Pending Review
          </h1>
          <p className="text-gray-500">{applications.length} applications</p>
        </div>
        <Button onClick={fetchApplications} disabled={loading} variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
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
                <Button variant="outline" onClick={() => { setShowRejectModal(null); setRejectionReason(''); }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => handleReject(showRejectModal)} disabled={!rejectionReason.trim() || actionLoading}>
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

      {/* Applications */}
      {!loading && applications.map((app) => {
        const riskScore = app.behaviorAnalysis?.riskScore || 0;
        const flags = getAIFlags(app);
        const isExpanded = expandedApp === app._id;

        return (
          <Card key={app._id} className="border shadow-sm">
            <CardContent className="p-4">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {app.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{app.fullName}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">#{app._id?.slice(-6).toUpperCase()}</code>
                      {getRiskBadge(riskScore)}
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
                      <span><FileText className="h-3 w-3 inline" /> {app.documentIdNumber}</span>
                      <span><Phone className="h-3 w-3 inline" /> +91 {app.mobileNumber}</span>
                      <span><MapPin className="h-3 w-3 inline" /> {app.city}, {app.state}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(app._id)} disabled={actionLoading === app._id}>
                    {actionLoading === app._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>}
                  </Button>
                  <Button variant="destructive" onClick={() => setShowRejectModal(app._id)} disabled={actionLoading === app._id}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setExpandedApp(isExpanded ? null : app._id)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Link href={`/officer/review/${app._id}`}>
                    <Button variant="outline"><Eye className="h-4 w-4 mr-1" /> View</Button>
                  </Link>
                </div>
              </div>

              {/* AI Flags */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Shield className="h-4 w-4" /> AI Analysis:
                </p>
                {flags.length === 0 ? (
                  <div className="bg-green-50 text-green-700 p-2 rounded flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> No issues detected
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {flags.map((f, i) => (
                      <span key={i} className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm">
                        {f.icon} {f.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t bg-gray-50 -mx-4 -mb-4 p-4 rounded-b">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Personal Info</h4>
                      <p><strong>Name:</strong> {app.fullName}</p>
                      <p><strong>Gender:</strong> {app.gender}</p>
                      <p><strong>Document ID:</strong> {app.documentIdNumber}</p>
                      <p><strong>Mobile:</strong> +91 {app.mobileNumber}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Address</h4>
                      <p>{app.addressLine1}</p>
                      {app.addressLine2 && <p>{app.addressLine2}</p>}
                      <p>{app.city}, {app.taluka}, {app.district}</p>
                      <p>{app.state} - {app.pincode}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Behavior Metrics</h4>
                      <p><strong>Risk Score:</strong> {riskScore}/100</p>
                      <p><strong>Typing Speed:</strong> {app.behaviorAnalysis?.typingSpeed || 0} cpm</p>
                      <p><strong>Mouse Moves:</strong> {app.behaviorAnalysis?.mouseMovements || 0}</p>
                      <p><strong>Time Spent:</strong> {app.behaviorAnalysis?.totalTimeSpent || 0}s</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}