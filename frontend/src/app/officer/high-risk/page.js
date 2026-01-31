'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HighRiskApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchApplications();
  }, [page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/officer/applications?status=submitted,under_officer_review&risk=high&page=${page}&limit=10`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(app =>
    app.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    app._id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            High Risk Applications
          </h1>
          <p className="text-gray-500 text-sm">{total} high-risk applications requiring attention</p>
        </div>
        <Button variant="outline" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Risk Score</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Indicators</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Submitted</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-red-500 mx-auto mb-2" />
                      <p className="text-gray-500">Loading...</p>
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No high-risk applications found
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app._id} className="border-b hover:bg-red-50/50">
                      <td className="p-4 font-mono text-xs">{app._id?.slice(-8).toUpperCase()}</td>
                      <td className="p-4 font-medium">{app.fullName}</td>
                      <td className="p-4">
                        <Badge className="bg-red-100 text-red-700">
                          {app.behaviorAnalysis?.riskScore || 0}/100
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-lg">⚠️ ❗</span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/officer/review/${app._id}`}>
                          <Button size="sm" className="bg-red-500 hover:bg-red-600">
                            <Eye className="h-4 w-4 mr-1" /> Review
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}