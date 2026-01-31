'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cpu, RefreshCw, Clock, Loader2 } from 'lucide-react';

export default function AIProcessingPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/officer/applications?status=under_automated_verification&limit=50`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-purple-500" />
            AI Processing
          </h1>
          <p className="text-gray-500 text-sm">{total} applications currently being processed by AI models</p>
        </div>
        <Button variant="outline" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border shadow-sm bg-purple-50">
        <CardContent className="p-4">
          <p className="text-sm text-purple-800">
            <strong>Info:</strong> These applications are currently being analyzed by our AI models for document verification, 
            face matching, and fraud detection. Once complete, they will move to "Pending Review" for your decision.
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Application ID</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Applicant</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
                      <p className="text-gray-500">Loading...</p>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <Cpu className="h-12 w-12 text-purple-200 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No applications in AI processing</p>
                      <p className="text-gray-400 text-sm mt-1">AI models process applications quickly</p>
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app._id} className="border-b">
                      <td className="p-4 font-mono text-xs">{app._id?.slice(-8).toUpperCase()}</td>
                      <td className="p-4">
                        <p className="font-medium">{app.fullName}</p>
                        <p className="text-xs text-gray-500">{app.documentIdNumber}</p>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-purple-100 text-purple-700">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          AI Processing
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}