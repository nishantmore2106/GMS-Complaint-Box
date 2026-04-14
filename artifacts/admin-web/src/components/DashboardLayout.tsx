import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, LayoutDashboard, Settings, AlertTriangle, Activity, LogOut, Bell, Search, Command } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    localStorage.removeItem('gms_admin_session');
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'System Controls', path: '/controls', icon: Settings },
    { name: 'App Issues', path: '/issues', icon: AlertTriangle },
    { name: 'System Logs', path: '/logs', icon: Activity },
    { name: 'Broadcast', path: '/broadcast', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar - Dark Glass Theme */}
      <aside className="w-[280px] bg-slate-900 flex-col hidden md:flex fixed h-full z-20 border-r border-slate-800 shadow-2xl">
        <div className="p-6 flex items-center gap-4 bg-slate-900/50 backdrop-blur-md sticky top-0 border-b border-slate-800">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-glow">
            <Building2 className="text-primary-light w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white tracking-tight leading-tight">GMS Admin</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Operations Center</p>
          </div>
        </div>
        
        <div className="px-4 py-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main Menu</p>
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium transition-all group ${
                    isActive 
                      ? 'bg-primary/10 text-primary-light border border-primary/20 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all"
          >
            <LogOut size={18} className="text-slate-500" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-[280px] flex flex-col min-h-screen bg-slate-50/50 relative">
        {/* Top Header - Glass Floating */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">
               {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
             </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-4 py-2 rounded-full border border-slate-200">
               <Search size={16} className="text-slate-400" />
               <span className="text-sm text-slate-500 font-medium">Quick Find...</span>
               <div className="ml-2 flex items-center gap-1 opacity-60">
                 <Command size={14} /> <span className="text-xs font-bold">K</span>
               </div>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Nishant More</p>
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">System Architect</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-sm">
                 <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-600 text-sm">NM</span>
                 </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-8 flex-1 w-full max-w-[1600px] mx-auto animate-fade-in relative z-0">
           {/* Subtle background element */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full filter blur-[100px] -z-10 pointer-events-none"></div>
           <Outlet />
        </div>
      </main>
    </div>
  );
}
