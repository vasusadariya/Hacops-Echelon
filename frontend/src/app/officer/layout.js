'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  FileSearch,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  Settings,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function OfficerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ 
    pending: 0, 
    highRisk: 0, 
    approved: 0, 
    rejected: 0, 
    total: 0,
    underAIVerification: 0 
  });

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/officer' },
    { id: 'ai-processing', label: 'AI Processing', icon: Cpu, href: '/officer/ai-processing', count: stats.underAIVerification, info: true },
    { id: 'pending', label: 'Pending Review', icon: Clock, href: '/officer/pending', count: stats.pending, highlight: true },
    { id: 'high-risk', label: 'High Risk', icon: AlertTriangle, href: '/officer/high-risk', count: stats.highRisk, danger: true },
    { id: 'approved', label: 'Approved', icon: CheckCircle, href: '/officer/approved', count: stats.approved },
    { id: 'rejected', label: 'Rejected', icon: XCircle, href: '/officer/rejected', count: stats.rejected },
    { id: 'all', label: 'All Applications', icon: FileSearch, href: '/officer/all', count: stats.total },
  ];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth?redirect=/officer');
      } else if (!['officer', 'admin'].includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (['officer', 'admin'].includes(user?.role)) {
      fetchStats();
      const interval = setInterval(fetchStats, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/officer/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !['officer', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Shield className="h-12 w-12 text-orange-500 mx-auto mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 hover:bg-gray-700 rounded"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/officer" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white font-bold">
                🏛️
              </div>
              <div>
                <h1 className="text-sm font-semibold">National Identity Verification Portal</h1>
                <p className="text-xs text-gray-400">Officer Dashboard • Government of India</p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500 hidden sm:flex">
              <Shield className="h-3 w-3 mr-1" />
              Verification Officer
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-gray-700 gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'V'}
                  </div>
                  <span className="hidden sm:inline font-medium">{user?.name?.toUpperCase()}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="px-4 py-2 flex items-center gap-6 text-sm bg-gray-900/50">
          <span className="text-gray-400">Quick Actions:</span>
          <Link href="/officer/pending" className="text-orange-400 hover:text-orange-300 font-medium">
            Pending Review ({stats.pending})
          </Link>
          <Link href="/officer/high-risk" className="text-red-400 hover:text-red-300 font-medium">
            High Risk ({stats.highRisk})
          </Link>
          <Link href="/officer/ai-processing" className="text-purple-400 hover:text-purple-300">
            AI Processing ({stats.underAIVerification})
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r shadow-sm
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:mt-0 mt-[100px]
        `}>
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Officer ID</p>
                <p className="text-sm font-mono font-bold text-gray-800">
                  {user?.id?.slice(-8).toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <nav className="p-3">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Applications
            </p>
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/officer' && pathname?.startsWith(item.href));
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all
                      ${isActive 
                        ? 'bg-orange-50 text-orange-700 font-medium border-l-4 border-orange-500 -ml-[2px] pl-[14px]' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${
                        isActive ? 'text-orange-600' : 
                        item.info ? 'text-purple-500' :
                        item.danger ? 'text-red-500' : 
                        item.highlight ? 'text-orange-500' : 'text-gray-400'
                      }`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <Badge className={`text-xs ${
                        item.danger ? 'bg-red-500' : 
                        item.highlight ? 'bg-orange-500' : 
                        item.info ? 'bg-purple-500' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {item.count}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50 text-center">
            <p className="text-xs text-gray-500">© 2024 Government of India</p>
            <p className="text-xs text-gray-400">Identity Verification System v1.0</p>
          </div>
        </aside>

        <main className="flex-1 min-h-[calc(100vh-100px)] p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}