import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Issues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();

    const channel = supabase.channel('app_issues_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_issues' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setIssues(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setIssues(prev => prev.map(i => i.id === payload.new.id ? payload.new : i));
        } else if (payload.eventType === 'DELETE') {
          setIssues(prev => prev.filter(i => i.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('app_issues')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setIssues(data);
    setLoading(false);
  };

  const markResolved = async (id: string) => {
    await supabase.from('app_issues').update({ status: 'resolved' }).eq('id', id);
    setIssues(issues.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold text-slate-800">App Issues Queue</h2>
           <p className="text-sm text-slate-500 mt-1">User-reported bugs and feedback.</p>
        </div>
        <ShieldAlert className="text-slate-300" size={32} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issues.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No issues reported. System is healthy.</td>
              </tr>
            )}
            {issues.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                    i.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    i.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {i.priority}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-800">{i.title}</td>
                <td className="p-4 text-sm text-slate-600 max-w-xs truncate">{i.description}</td>
                <td className="p-4 text-sm text-slate-600">v{i.app_version}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                    i.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {i.status}
                  </span>
                </td>
                <td className="p-4">
                  {i.status !== 'resolved' && (
                    <button 
                      onClick={() => markResolved(i.id)}
                      className="text-primary hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 size={16} /> Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
