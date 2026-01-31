'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export default function PendingApplicationsPage() {
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
        `/api/officer/applications?status=submitted,under_officer_review&page=${page}&limit=10&sort=newest`,
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
    app._id?.toLowerCase().includes(search.toLowerCase()) ||
    app.documentIdNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskBadge = (score) => {
    if (score >= 70) return <Badge className="bg-red-100 text-red-700">High</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-700">Low</Badge>;
  };

  const getRiskIndicators = (app) => {
    const indicators = [];
    const risk = app.behaviorAnalysis?.riskScore || 0;
    if (risk >= 50) indicators.push('⚠️');
    if (app.behaviorAnalysis?.suspiciousActivity) indicators.push('❗');
    return indicators;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            Pending Review
          </h1>
          <p className="text-gray-500 text-sm">{total} applications awaiting review</p>
        </div>
        <Button variant="outline" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, ID, or document number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Application ID</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Applicant Name</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Document ID</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Risk Level</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Indicators</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Submitted</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
                      <p className="text-gray-500">Loading applications...</p>
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      No pending applications found
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const indicators = getRiskIndicators(app);
                    return (
                      <tr key={app._id} className="border-b hover:bg-orange-50/50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded font-medium">
                            {app._id?.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-900">{app.fullName}</td>
                        <td className="p-4 font-mono text-xs text-gray-600">{app.documentIdNumber}</td>
                        <td className="p-4">{getRiskBadge(app.behaviorAnalysis?.riskScore || 0)}</td>
                        <td className="p-4">
                          {indicators.length === 0 ? (
                            <span className="text-green-600 text-sm">✓ Clear</span>
                          ) : (
                            <span className="text-lg">{indicators.join(' ')}</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 text-sm">
                          {app.submittedAt 
                            ? new Date(app.submittedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'
                          }
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/officer/review/${app._id}`}>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages} • {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
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