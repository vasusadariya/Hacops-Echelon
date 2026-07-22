'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Cpu, RefreshCw, Eye, Loader2, AlertTriangle, Clock
} from 'lucide-react';

export default function AIProcessingPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchApplications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/officer/applications?status=under_automated_verification&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await res.json();
      setApplications(data.applications || []);
      setError('');

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
            <Cpu className="h-6 w-6 text-purple-500" />
            AI Processing
          </h1>
          <p className="text-gray-500">{applications.length} applications being processed by AI</p>
        </div>
        <Button onClick={fetchApplications} disabled={loading} variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Alert className="bg-purple-50 border-purple-200">
        <Cpu className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-700">
          These applications are currently being analyzed by our AI models. They will automatically appear in "Pending Review" once processing is complete.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-4" />
            <p>Loading applications...</p>
          </CardContent>
        </Card>
      )}

      {!loading && applications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Cpu className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No Applications in AI Processing</h3>
            <p className="text-gray-500 mt-2">All applications have completed AI verification.</p>
          </CardContent>
        </Card>
      )}

      {!loading && applications.map((app) => (
        <Card key={app._id} className="border-purple-200 bg-purple-50/30 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">{app.fullName}</h3>
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      #{app._id?.slice(-6).toUpperCase()}
                    </code>
                    <Badge className="bg-purple-100 text-purple-700">
                      <Cpu className="h-3 w-3 mr-1" /> AI Processing
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {app.city}, {app.state} • Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <div className="p-2 rounded border bg-white text-center min-w-[100px]">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="text-sm font-medium text-purple-600 flex items-center justify-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> In progress
                  </div>
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
      ))}
    </div>
  );
}