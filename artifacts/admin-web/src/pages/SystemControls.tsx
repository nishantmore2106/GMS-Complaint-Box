import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Power, Save } from 'lucide-react';

export default function SystemControls() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [version, setVersion] = useState('');
  const [minVersion, setMinVersion] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').single();
      if (data) {
        setSettings(data);
        setVersion(data.current_version || '');
        setMinVersion(data.min_supported_version || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      await supabase.from('system_settings').update({ [key]: value }).eq('id', settings.id);
      setSettings({ ...settings, [key]: value });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveVersions = async () => {
    setSaving(true);
    try {
      await supabase.from('system_settings').update({
        current_version: version,
        min_supported_version: minVersion
      }).eq('id', settings.id);
      setSettings({ ...settings, current_version: version, min_supported_version: minVersion });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Power Controls */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Critical Systems</h2>
            <p className="text-sm text-slate-500 mt-1">Global operations switches.</p>
          </div>
          <Power className="text-slate-300" size={32} />
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-slate-800">Maintenance Mode</h3>
              <p className="text-sm text-slate-500 mt-1">Blocks all user logins with a friendly maintenance screen.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings?.is_maintenance_mode || false}
                onChange={(e) => updateSetting('is_maintenance_mode', e.target.checked)}
                disabled={saving}
              />
              <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
            <div>
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <ShieldAlert size={18} />
                Emergency Pause
              </h3>
              <p className="text-sm text-red-600 mt-1">Instantly freeze all API requests and connections immediately.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings?.is_paused || false}
                onChange={(e) => updateSetting('is_paused', e.target.checked)}
                disabled={saving}
              />
              <div className="w-14 h-7 bg-red-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Version Management */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Version Management</h2>
          <p className="text-sm text-slate-500 mt-1">Control required app updates across iOS and Android.</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Version (Live)</label>
              <input 
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Supported (Force Update)</label>
              <input 
                type="text"
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button 
              onClick={saveVersions}
              disabled={saving}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl flex items-center gap-2 transition-colors"
            >
              <Save size={18} />
              Save Configuration
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
