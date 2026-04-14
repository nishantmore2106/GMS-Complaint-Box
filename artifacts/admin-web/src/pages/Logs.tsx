import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    const channel = supabase.channel('system_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setLogs(data);
    setLoading(false);
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
           <h2 className="text-xl font-bold text-slate-800">System Logs</h2>
           <p className="text-sm text-slate-500 mt-1">Real-time operational stream (Last 100).</p>
        </div>
        <Activity className="text-slate-300" size={32} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-sm leading-relaxed">
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 font-sans">No logs found.</td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    log.level === 'error' ? 'bg-red-100 text-red-700' :
                    log.level === 'warn' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.level || 'INFO'}
                  </span>
                </td>
                <td className="p-4 text-slate-600 truncate max-w-[150px]">{log.type}</td>
                <td className="p-4 text-slate-800 break-words">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
