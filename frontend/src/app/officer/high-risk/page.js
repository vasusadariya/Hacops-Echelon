'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle, RefreshCw, Eye, CheckCircle, XCircle,
  Loader2, Shield, Brain, ScanFace, FileCheck, Bot, Fingerprint
} from 'lucide-react';

export default function HighRiskApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/officer/applications?risk=high&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch applications');
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

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status) => {
    const config = {
      submitted: { className: 'bg-blue-100 text-blue-700', label: 'Submitted' },
      under_officer_review: { className: 'bg-yellow-100 text-yellow-700', label: 'Under Review' },
      under_automated_verification: { className: 'bg-purple-100 text-purple-700', label: 'AI Processing' },
      approved: { className: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-700', label: 'Rejected' }
    };
    const c = config[status] || { className: 'bg-gray-100 text-gray-700', label: status };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            High Risk Applications
          </h1>
          <p className="text-gray-500">{applications.length} applications flagged as high risk</p>
        </div>
        <Button onClick={fetchApplications} disabled={loading} variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-red-500 mx-auto mb-4" />
            <p>Loading high risk applications...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && applications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No High Risk Applications</h3>
            <p className="text-gray-500 mt-2">All applications are within acceptable risk levels.</p>
          </CardContent>
        </Card>
      )}

      {/* Applications */}
      {!loading && applications.map((app) => {
        const ai = app.aiVerification || {};
        const aiScore = ai.overallScore || 0;
        const botLikelihood = app.behaviorSummary?.botLikelihood || 0;

        return (
          <Card key={app._id} className="border-2 border-red-200 bg-red-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {app.fullName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{app.fullName}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        #{app._id?.slice(-6).toUpperCase()}
                      </code>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {app.city}, {app.state} • {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="flex gap-3 flex-wrap">
                  <div className={`p-2 rounded border text-center min-w-[80px] ${aiScore >= 70 ? 'bg-green-50 border-green-200' : aiScore >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-xs text-gray-500">AI Score</div>
                    <div className={`text-lg font-bold ${getScoreColor(aiScore)}`}>{aiScore}</div>
                  </div>
                  <div className={`p-2 rounded border text-center min-w-[80px] ${botLikelihood < 30 ? 'bg-green-50 border-green-200' : botLikelihood < 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-xs text-gray-500">Bot Risk</div>
                    <div className={`text-lg font-bold ${botLikelihood < 30 ? 'text-green-600' : botLikelihood < 60 ? 'text-yellow-600' : 'text-red-600'}`}>{botLikelihood}%</div>
                  </div>
                </div>

                {/* Actions */}
                <Link href={`/officer/review/${app._id}`}>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Eye className="h-4 w-4 mr-2" /> Review
                  </Button>
                </Link>
              </div>

              {/* Issues Preview */}
              {ai.issues?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm font-medium text-red-700 mb-2">⚠️ Issues Detected:</p>
                  <div className="flex flex-wrap gap-2">
                    {ai.issues.slice(0, 3).map((issue, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                    {ai.issues.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{ai.issues.length - 3} more</Badge>
                    )}
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