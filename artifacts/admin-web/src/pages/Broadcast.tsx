import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Send } from 'lucide-react';

export default function Broadcast() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccess('');

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
         method: 'POST',
         headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            to: (await getTargetTokens(role)),
            sound: 'default',
            title: title,
            body: message,
            data: { priority: 'high', type: 'system_broadcast' },
         }),
      });

      if (response.ok) {
         setSuccess('Broadcast dispatched successfully.');
         setTitle('');
         setMessage('');
      } else {
         throw new Error("Push API failed");
      }
    } catch (e) {
      console.error(e);
      setSuccess('Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const getTargetTokens = async (targetRole: string) => {
     let query = supabase.from('users').select('push_token').not('push_token', 'is', null);
     if (targetRole !== 'all') {
        query = query.eq('role', targetRole);
     }
     const { data } = await query;
     return (data || []).map(u => u.push_token);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-primary p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <Bell className="text-white mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white relative z-10">Global Broadcast</h2>
          <p className="text-primary-100 relative z-10 mt-1">Send immediate push notifications to target user segments.</p>
        </div>

        <form onSubmit={handleSend} className="p-8">
          {success && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${success.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {success}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notification Title</label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Notice"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message Body</label>
              <textarea 
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain the update or action required..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors resize-none"
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Target Audience</label>
              <div className="flex flex-wrap gap-4">
                {['all', 'client', 'supervisor', 'founder'].map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      disabled={sending}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700 capitalize">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
               type="submit"
               disabled={sending || !title || !message}
               className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-slate-800/20 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
               {sending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                  <>
                    <Send size={18} /> Push Notification
                  </>
               )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
