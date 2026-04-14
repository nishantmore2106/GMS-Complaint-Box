import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Building2, AlertTriangle, CheckCircle, Activity, TrendingUp } from 'lucide-react';

export default function Overview() {
  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    sups: 0,
    sites: 0,
    complaints: 0,
    resolved: 0,
    issues: 0,
    criticalIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    const channel = supabase.channel('overview_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_issues' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const [uRes, sRes, cRes, iRes] = await Promise.all([
        supabase.from('users').select('role', { count: 'exact' }),
        supabase.from('sites').select('id', { count: 'exact' }),
        supabase.from('complaints').select('status', { count: 'exact' }),
        supabase.from('app_issues').select('status, priority', { count: 'exact' })
      ]);

      const users = uRes.data || [];
      const complaints = cRes.data || [];
      const issues = iRes.data || [];

      setStats({
        users: users.length,
        clients: users.filter(u => u.role === 'client').length,
        sups: users.filter(u => u.role === 'supervisor').length,
        sites: sRes.count || 0,
        complaints: complaints.length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        issues: issues.filter(i => i.status !== 'resolved').length,
        criticalIssues: issues.filter(i => i.priority === 'critical' && i.status !== 'resolved').length
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-40">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-indigo-400/20 border-b-indigo-500 rounded-full animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Platform Users', 
      value: stats.users, 
      sub: `${stats.clients} Clients`, 
      icon: Users, 
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      text: 'text-blue-50'
    },
    { 
      label: 'Managed Facilities', 
      value: stats.sites, 
      sub: 'Active Systems', 
      icon: Building2, 
      gradient: 'from-emerald-400 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      text: 'text-emerald-50'
    },
    { 
      label: 'Critical App Issues', 
      value: stats.issues, 
      sub: `${stats.criticalIssues} High Priority`, 
      icon: AlertTriangle, 
      gradient: 'from-orange-400 to-red-500',
      shadow: 'shadow-orange-500/20',
      text: 'text-orange-50'
    },
    { 
      label: 'Complaint Resolution', 
      value: stats.resolved, 
      sub: `Out of ${stats.complaints} Total`, 
      icon: CheckCircle, 
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/20',
      text: 'text-purple-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
         <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
         <div className="relative z-10 w-full">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Status looks healthy.</h2>
            <p className="text-slate-500 mt-2 text-lg max-w-2xl">All core services are operational. Server response times are optimal and real-time synchronisation is active across all mobile nodes.</p>
         </div>
         <div className="hidden md:flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 relative z-10">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-slate-700">All Systems Go</span>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-[1.5rem] p-6 shadow-lg ${s.shadow} relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className={`w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20 shadow-inner`}>
              <s.icon className="text-white" size={24} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${s.text} opacity-90 mb-1`}>{s.label}</p>
              <h3 className="text-4xl font-extrabold text-white tracking-tight">{s.value}</h3>
              <div className="flex items-center gap-1.5 mt-3">
                 <TrendingUp size={14} className={s.text} />
                 <p className={`text-xs font-bold ${s.text} uppercase tracking-wider`}>{s.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deep Analytics Placeholder */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-slate-400 group relative overflow-hidden">
         <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         <Activity size={56} className="mb-6 text-slate-300 group-hover:text-primary transition-colors duration-500" />
         <h3 className="text-xl font-bold text-slate-700 mb-2">Live Telemetry Dashboard</h3>
         <p className="font-medium text-slate-500">Real-time charts and spatial analytics modules will deploy here.</p>
      </div>
    </div>
  );
}
