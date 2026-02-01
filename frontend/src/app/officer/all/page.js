'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSearch, Search, RefreshCw, Eye, ChevronLeft, ChevronRight, Filter, AlertTriangle, Cpu } from 'lucide-react';

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { 
    fetchApplications(); 
  }, [page, statusFilter, riskFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (riskFilter !== 'all') params.append('risk', riskFilter);
      
      const res = await fetch(`/api/officer/applications?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
        setTotal(data.total || data.pagination?.total || 0);
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredApps = applications.filter(app =>
    app.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    app._id?.toLowerCase().includes(search.toLowerCase()) ||
    app.documentIdNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status, isHighRisk) => {
    const config = {
      draft: { className: 'bg-gray-100 text-gray-700', label: 'Draft' },
      submitted: { className: 'bg-blue-100 text-blue-700', label: 'Submitted' },
      under_automated_verification: { className: 'bg-purple-100 text-purple-700', label: 'AI Processing' },
      under_officer_review: { className: 'bg-yellow-100 text-yellow-700', label: 'Under Review' },
      approved: { className: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-700', label: 'Rejected' }
    };
    const c = config[status] || { className: 'bg-gray-100 text-gray-700', label: status };
    return (
      <div className="flex items-center gap-1">
        <Badge className={c.className}>{c.label}</Badge>
        {isHighRisk && <Badge className="bg-red-500 text-white text-xs"><AlertTriangle className="h-3 w-3" /></Badge>}
      </div>
    );
  };

  const getRiskBadge = (app) => {
    const aiScore = app.aiVerification?.overallScore || 0;
    const botLikelihood = app.behaviorSummary?.botLikelihood || 0;
    const riskLevel = app.aiVerification?.riskLevel || app.behaviorSummary?.riskLevel || 'MEDIUM';
    
    // Use AI score if available, otherwise use behavior risk
    if (aiScore > 0) {
      if (aiScore < 40 || riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
        return <Badge className="bg-red-100 text-red-700">High ({aiScore})</Badge>;
      }
      if (aiScore < 70 || riskLevel === 'MEDIUM') {
        return <Badge className="bg-yellow-100 text-yellow-700">Medium ({aiScore})</Badge>;
      }
      return <Badge className="bg-green-100 text-green-700">Low ({aiScore})</Badge>;
    }
    
    // Fallback to bot likelihood
    if (botLikelihood >= 70) return <Badge className="bg-red-100 text-red-700">High</Badge>;
    if (botLikelihood >= 40) return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-700">Low</Badge>;
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleRiskChange = (value) => {
    setRiskFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-blue-500" />
            All Applications
          </h1>
          <p className="text-gray-500 text-sm">{total} total applications</p>
        </div>
        <Button variant="outline" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name, ID, or document number..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted (Queued)</SelectItem>
                <SelectItem value="under_automated_verification">AI Processing</SelectItem>
                <SelectItem value="under_officer_review">Under Officer Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={handleRiskChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
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
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Risk / AI Score</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Submitted</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p className="text-gray-500">Loading applications...</p>
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app._id} className={`border-b hover:bg-gray-50 transition-colors ${app.isHighRisk ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded font-medium">
                          {app._id?.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-900">{app.fullName}</td>
                      <td className="p-4 font-mono text-xs text-gray-600">{app.documentIdNumber}</td>
                      <td className="p-4">{getStatusBadge(app.status, app.isHighRisk)}</td>
                      <td className="p-4">{getRiskBadge(app)}</td>
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages} • {total} total applications
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