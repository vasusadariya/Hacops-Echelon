'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { XCircle, Search, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RejectedApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchApplications(); }, [page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/officer/applications?status=rejected&page=${page}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredApps = applications.filter(app =>
    app.fullName?.toLowerCase().includes(search.toLowerCase()) || app._id?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            Rejected Applications
          </h1>
          <p className="text-gray-500 text-sm">{total} rejected applications</p>
        </div>
        <Button variant="outline" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">ID</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Reason</th>
                  <th className="text-left p-4 font-semibold">Rejected On</th>
                  <th className="text-right p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-gray-500 mx-auto" /></td></tr>
                ) : filteredApps.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">No rejected applications</td></tr>
                ) : filteredApps.map((app) => (
                  <tr key={app._id} className="border-b hover:bg-red-50/30">
                    <td className="p-4 font-mono text-xs">{app._id?.slice(-8).toUpperCase()}</td>
                    <td className="p-4 font-medium">{app.fullName}</td>
                    <td className="p-4"><Badge className="bg-red-100 text-red-700">Rejected</Badge></td>
                    <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{app.rejectionReason || '-'}</td>
                    <td className="p-4 text-gray-500 text-sm">{app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="p-4 text-right">
                      <Link href={`/officer/review/${app._id}`}>
                        <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" /> View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}