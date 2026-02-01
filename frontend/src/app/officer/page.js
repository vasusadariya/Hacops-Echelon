'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSearch,
  ArrowRight,
  RefreshCw,
  Eye,
  Cpu,
  Brain,
  Shield,
  ScanFace,
  FileCheck
} from 'lucide-react';

export default function OfficerDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0,
    todayProcessed: 0,
    underAIVerification: 0
  });
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [statsRes, pendingRes] = await Promise.all([
        fetch('/api/officer/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/officer/applications?status=under_officer_review&limit=10&sort=newest', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Applications', value: stats.total, icon: FileSearch, color: 'bg-blue-500', bgColor: 'bg-blue-50', link: '/officer/all' },
    { title: 'AI Processing', value: stats.underAIVerification, icon: Cpu, color: 'bg-purple-500', bgColor: 'bg-purple-50', link: '/officer/ai-processing' },
    { title: 'Pending Review', value: stats.pending, icon: Clock, color: 'bg-orange-500', bgColor: 'bg-orange-50', link: '/officer/pending', urgent: stats.pending > 0 },
    { title: 'High Risk', value: stats.highRisk, icon: AlertTriangle, color: 'bg-red-500', bgColor: 'bg-red-50', link: '/officer/high-risk', urgent: stats.highRisk > 0 },
    { title: 'Approved', value: stats.approved, icon: CheckCircle, color: 'bg-green-500', bgColor: 'bg-green-50', link: '/officer/approved' },
    { title: 'Rejected', value: stats.rejected, icon: XCircle, color: 'bg-gray-500', bgColor: 'bg-gray-50', link: '/officer/rejected' },
  ];

  const getAIScoreBadge = (app) => {
    const aiScore = app.aiVerification?.overallScore;
    if (aiScore === undefined || aiScore === null) {
      return <Badge className="bg-gray-100 text-gray-600 text-xs">No AI Data</Badge>;
    }
    
    if (aiScore >= 70) return <Badge className="bg-green-500 text-white text-xs">AI: {aiScore}/100</Badge>;
    if (aiScore >= 40) return <Badge className="bg-yellow-500 text-white text-xs">AI: {aiScore}/100</Badge>;
    return <Badge className="bg-red-500 text-white text-xs">AI: {aiScore}/100</Badge>;
  };

  const getBehaviorBadge = (app) => {
    const botLikelihood = app.behaviorSummary?.botLikelihood || app.behaviorAnalysis?.riskScore || 0;
    
    if (botLikelihood < 30) return <Badge className="bg-green-100 text-green-700 text-xs">Human ✓</Badge>;
    if (botLikelihood < 60) return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Check ({botLikelihood}%)</Badge>;
    return <Badge className="bg-red-100 text-red-700 text-xs">Bot? ({botLikelihood}%)</Badge>;
  };

  const getAIFlags = (app) => {
    const flags = [];
    const aiVerification = app.aiVerification || {};
    
    // Face verification
    if (aiVerification.faceVerified === false) {
      flags.push({ icon: '👤', label: 'Face Issue', color: 'text-red-600' });
    }
    
    // Document verification
    if (aiVerification.documentsVerified === false) {
      flags.push({ icon: '📄', label: 'Doc Issue', color: 'text-orange-600' });
    }
    
    // AI decision
    if (aiVerification.decision === 'REJECTED') {
      flags.push({ icon: '🚨', label: 'AI Rejected', color: 'text-red-600' });
    } else if (aiVerification.decision === 'REVIEW_REQUIRED') {
      flags.push({ icon: '⚠️', label: 'Review Needed', color: 'text-yellow-600' });
    }
    
    // Behavioral flags
    if (app.behaviorSummary?.botLikelihood >= 50) {
      flags.push({ icon: '🤖', label: 'Bot Suspected', color: 'text-red-600' });
    }
    
    return flags;
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={`${stat.bgColor} border-0 shadow-sm hover:shadow-md transition-all ${stat.urgent ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${stat.color} p-2.5 rounded-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {stat.urgent && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-bold animate-pulse">!</span>}
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                {stat.link && (
                  <Link href={stat.link} className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center font-medium">
                    View <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Pending Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50 border-b py-4">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <Link href="/officer/pending">
              <Button variant="outline" className="w-full justify-between bg-orange-50 hover:bg-orange-100 border-orange-200">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-orange-600" />Pending Review</span>
                <Badge className="bg-orange-500">{stats.pending}</Badge>
              </Button>
            </Link>
            <Link href="/officer/high-risk">
              <Button variant="outline" className="w-full justify-between bg-red-50 hover:bg-red-100 border-red-200">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" />High Risk</span>
                <Badge className="bg-red-500">{stats.highRisk}</Badge>
              </Button>
            </Link>
            <Link href="/officer/ai-processing">
              <Button variant="outline" className="w-full justify-between bg-purple-50 hover:bg-purple-100 border-purple-200">
                <span className="flex items-center gap-2"><Cpu className="h-4 w-4 text-purple-600" />AI Processing</span>
                <Badge className="bg-purple-500">{stats.underAIVerification}</Badge>
              </Button>
            </Link>
            <Link href="/officer/all">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileSearch className="h-4 w-4" />All Applications
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="bg-gray-50 border-b py-4 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Applications Awaiting Your Review</CardTitle>
              <p className="text-xs text-gray-500 mt-1">These applications have passed AI verification and need your decision</p>
            </div>
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
                    <th className="text-left p-3 font-semibold text-gray-600">Applicant</th>
                    <th className="text-left p-3 font-semibold text-gray-600">AI Score</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Behavior</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Flags</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Submitted</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-orange-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Loading...</p>
                      </td>
                    </tr>
                  ) : pendingApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">All caught up!</p>
                        <p className="text-gray-400 text-xs mt-1">No applications pending your review</p>
                      </td>
                    </tr>
                  ) : (
                    pendingApplications.map((app) => {
                      const aiFlags = getAIFlags(app);
                      return (
                        <tr key={app._id} className="border-b hover:bg-orange-50/50 transition-colors">
                          <td className="p-3">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded font-semibold">
                              {app._id?.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-gray-900">{app.fullName}</p>
                              <p className="text-xs text-gray-500">{app.city}, {app.state}</p>
                            </div>
                          </td>
                          <td className="p-3">{getAIScoreBadge(app)}</td>
                          <td className="p-3">{getBehaviorBadge(app)}</td>
                          <td className="p-3">
                            {aiFlags.length === 0 ? (
                              <span className="text-green-600 text-sm flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" /> Clear
                              </span>
                            ) : (
                              <div className="flex gap-1 flex-wrap">
                                {aiFlags.slice(0, 3).map((f, i) => (
                                  <span key={i} className={`text-lg cursor-help ${f.color}`} title={f.label}>{f.icon}</span>
                                ))}
                                {aiFlags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{aiFlags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-gray-500 text-xs">
                            {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <Link href={`/officer/review/${app._id}`}>
                              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                                <Eye className="h-3 w-3 mr-1" /> Review
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
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">AI Verification Scores & Flags:</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>AI Score 70-100 (Low Risk)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>AI Score 40-69 (Medium Risk)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>AI Score 0-39 (High Risk)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>Face Verification Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span>Document Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🤖</span>
              <span>Bot Suspected</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚨</span>
              <span>AI Rejected</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}