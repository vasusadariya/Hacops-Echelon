'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSearch,
  Activity,
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';

export default function OfficerDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0,
    todayProcessed: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [statsRes, recentRes] = await Promise.all([
        fetch('/api/officer/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/officer/applications?limit=10&status=submitted,under_officer_review&sort=newest', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Applications', 
      value: stats.total, 
      icon: FileSearch, 
      color: 'bg-blue-500', 
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      link: '/officer/all' 
    },
    { 
      title: 'Pending Review', 
      value: stats.pending, 
      icon: Clock, 
      color: 'bg-orange-500', 
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      link: '/officer/pending',
      urgent: stats.pending > 0
    },
    { 
      title: 'High Risk', 
      value: stats.highRisk, 
      icon: AlertTriangle, 
      color: 'bg-red-500', 
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
      link: '/officer/high-risk',
      urgent: stats.highRisk > 0
    },
    { 
      title: 'Approved', 
      value: stats.approved, 
      icon: CheckCircle, 
      color: 'bg-green-500', 
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      link: '/officer/approved'
    },
    { 
      title: 'Rejected', 
      value: stats.rejected, 
      icon: XCircle, 
      color: 'bg-gray-500', 
      bgColor: 'bg-gray-50',
      iconBg: 'bg-gray-100',
      link: '/officer/rejected'
    },
    { 
      title: 'Today Processed', 
      value: stats.todayProcessed, 
      icon: Activity, 
      color: 'bg-purple-500', 
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      link: null
    },
  ];

  const getRiskBadge = (score) => {
    if (score >= 70) return <Badge className="bg-red-100 text-red-700 text-xs">High</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-700 text-xs">Low</Badge>;
  };

  const getStatusBadge = (status) => {
    const config = {
      submitted: { className: 'bg-blue-100 text-blue-700', label: 'Submitted' },
      under_officer_review: { className: 'bg-yellow-100 text-yellow-700', label: 'Under Review' },
      approved: { className: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-700', label: 'Rejected' }
    };
    const c = config[status] || { className: 'bg-gray-100 text-gray-700', label: status };
    return <Badge className={`${c.className} text-xs`}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">Verification Officer Portal</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={idx} 
              className={`${stat.bgColor} border-0 shadow-sm hover:shadow-md transition-all ${
                stat.urgent ? 'ring-2 ring-orange-400 ring-offset-2' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${stat.iconBg} p-2.5 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  {stat.urgent && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">!</span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                {stat.link && (
                  <Link 
                    href={stat.link} 
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-flex items-center font-medium"
                  >
                    View <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50 border-b py-4">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <Link href="/officer/pending">
              <Button 
                variant="outline" 
                className="w-full justify-between bg-orange-50 hover:bg-orange-100 border-orange-200 text-left"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Pending
                </span>
                <Badge className="bg-orange-500 hover:bg-orange-600">{stats.pending}</Badge>
              </Button>
            </Link>
            <Link href="/officer/high-risk">
              <Button 
                variant="outline" 
                className="w-full justify-between bg-red-50 hover:bg-red-100 border-red-200 text-left"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  High Risk
                </span>
                <Badge className="bg-red-500 hover:bg-red-600">{stats.highRisk}</Badge>
              </Button>
            </Link>
            <Link href="/officer/all">
              <Button variant="outline" className="w-full justify-start gap-2 text-left">
                <FileSearch className="h-4 w-4 text-gray-600" />
                All Applications
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="bg-gray-50 border-b py-4 flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
            <Link href="/officer/pending">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-600">ID</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Risk</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Date</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Loading...</p>
                      </td>
                    </tr>
                  ) : recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    recentApplications.map((app) => (
                      <tr key={app._id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {app._id?.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-900">{app.fullName}</td>
                        <td className="p-3">{getStatusBadge(app.status)}</td>
                        <td className="p-3">{getRiskBadge(app.behaviorAnalysis?.riskScore || 0)}</td>
                        <td className="p-3 text-gray-500 text-xs">
                          {app.submittedAt 
                            ? new Date(app.submittedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'
                          }
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/officer/review/${app._id}`}>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                              <Eye className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                          </Link>
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

      {/* Risk Score Legend */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Risk Score Legend:</p>
          <div className="flex flex-wrap gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-600">Low (0-39)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-gray-600">Medium (40-69)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-gray-600">High (70-100)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}