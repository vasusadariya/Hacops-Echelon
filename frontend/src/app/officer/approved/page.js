'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle, RefreshCw, Eye, Loader2, AlertTriangle, Brain
} from 'lucide-react';

export default function ApprovedApplicationsPage() {
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
      const res = await fetch('/api/officer/applications?status=approved&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await res.json();
      setApplications(data.applications || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Approved Applications
          </h1>
          <p className="text-gray-500">{applications.length} approved applications</p>
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

      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-green-500 mx-auto mb-4" />
            <p>Loading approved applications...</p>
          </CardContent>
        </Card>
      )}

      {!loading && applications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No Approved Applications</h3>
            <p className="text-gray-500 mt-2">No applications have been approved yet.</p>
          </CardContent>
        </Card>
      )}

      {!loading && applications.map((app) => {
        const ai = app.aiVerification || {};
        const aiScore = ai.overallScore || 0;

        return (
          <Card key={app._id} className="border-green-200 bg-green-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{app.fullName}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        #{app._id?.slice(-6).toUpperCase()}
                      </code>
                      <Badge className="bg-green-100 text-green-700">Approved</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {app.city}, {app.state} • Approved: {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="p-2 rounded border bg-white text-center min-w-[80px]">
                    <div className="text-xs text-gray-500">AI Score</div>
                    <div className="text-lg font-bold text-green-600">{aiScore}</div>
                  </div>
                  <Link href={`/officer/review/${app._id}`}>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}