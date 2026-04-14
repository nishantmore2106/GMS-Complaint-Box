import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Bell, 
  Camera, 
  CheckCircle, 
  Clock, 
  Activity, 
  ChevronRight, 
  MapPin, 
  Briefcase,
  ArrowRight,
  Inbox,
  LogOut,
  UserPlus,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Colors = {
  primary: '#2563EB',
  secondary: '#1D4ED8',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  accent: '#3B82F6',
  pending: '#EF4444',
  pendingBg: '#FEE2E2',
  inProgress: '#F59E0B',
  inProgressBg: '#FEF3C7',
  resolved: '#10B981',
  resolvedBg: '#D1FAE5',
  white: '#FFFFFF'
};

const KPICard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="flex-1 p-3 rounded-2xl flex flex-col gap-1" style={{ backgroundColor: bg }}>
    <Icon size={16} color={color} />
    <span className="text-lg font-bold" style={{ color: color }}>{value}</span>
    <span className="text-[10px] font-medium opacity-70" style={{ color: color }}>{label}</span>
  </div>
);

const ComplaintCard = ({ complaint }: any) => (
  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: complaint.status === 'pending' ? Colors.pending : complaint.status === 'in_progress' ? Colors.inProgress : Colors.resolved }} />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{complaint.category}</span>
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</span>
    </div>
    <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">{complaint.description}</p>
    <div className="flex items-center gap-1">
      <MapPin size={10} className="text-blue-500" />
      <span className="text-[10px] font-medium text-slate-500">{complaint.siteName || 'HQ'}</span>
    </div>
  </div>
);

export default function IPhonePreview() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('nishantmore087@gmail.com');
  const [authPass, setAuthPass] = useState('more123');
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Admin features
  const [showAddSup, setShowAddSup] = useState(false);
  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supPass, setSupPass] = useState("");
  const [supLoading, setSupLoading] = useState(false);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('users').select('*').eq('supabase_id', id).single();
    if (data) setUser(data);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (data) setComplaints(data);
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setUser(null);
    });
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPass,
      });
      if (error) throw error;
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleInitialSetup = async () => {
    setIsSigningIn(true);
    setAuthError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: "nishantmore087@gmail.com",
        password: "more123",
      });
      if (authError) throw authError;
      if (authData.user) {
        let compId: string;
        const { data: existingComp } = await supabase.from("companies").select("id").eq("name", "GMS Industries").single();
        if (existingComp) {
          compId = existingComp.id;
        } else {
          const { data: newComp, error: compErr } = await supabase.from("companies").insert([{ name: "GMS Industries" }]).select().single();
          if (compErr) throw compErr;
          compId = newComp.id;
        }
        await supabase.from("users").insert([{
          supabase_id: authData.user.id,
          name: "Nishant More",
          phone: "9876543210",
          role: "founder",
          company_id: compId
        }]);
        setAuthError("SUCCESS! Founder created. You can now Sign In.");
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const stats = useMemo(() => ({
    pending: complaints.filter(c => c.status === 'pending').length,
    active: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    urgent: complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length
  }), [complaints]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-900"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-8 font-sans">
      <div className="relative w-[375px] h-[812px] bg-black rounded-[60px] shadow-2xl border-[8px] border-slate-900 overflow-hidden outline outline-[2px] outline-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50"></div>
        
        <div className="absolute inset-0 bg-[#F8FAFC] overflow-y-auto pt-12 pb-24 px-4 scrollbar-hide">
          
          {!session || !user ? (
            <div className="flex flex-col gap-6 pt-10">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Briefcase size={24} color="white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mt-4">Welcome Back</h2>
                <p className="text-sm text-slate-500">Sign in to manage your complaints</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 ml-1">WORK EMAIL</span>
                  <input 
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm focus:border-blue-500 outline-none"
                    placeholder="name@company.com"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 ml-1">PASSWORD</span>
                  <input 
                    type="password"
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm focus:border-blue-500 outline-none"
                    placeholder="••••••••"
                    value={authPass}
                    onChange={e => setAuthPass(e.target.value)}
                  />
                </div>

                {authError && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{authError}</p>}

                <button 
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full h-12 bg-blue-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSigningIn ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
                </button>

                <div className="flex flex-col gap-3 mt-4">
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Initial Setup Tools</p>
                  <button onClick={handleInitialSetup} className="text-xs font-semibold text-slate-500 underline">Create Founder Account First</button>
                  <div className="bg-slate-100 p-3 rounded-xl gap-1 flex flex-col">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">PRE-FILLED FOUNDER</p>
                    <p className="text-[11px] font-mono text-slate-600">nishantmore087@gmail.com / more123</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Content */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase size={12} />
                    <span className="text-[11px] font-medium tracking-tight">GMS INDUSTRIES</span>
                  </div>
                  <h1 className="text-2xl font-light text-slate-900">
                    Hello, <span className="font-bold">{user.name.split(' ')[0]}</span>
                  </h1>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200">
                  <LogOut size={16} />
                </button>
              </div>

              {/* Management Section for Founder */}
              {user.role === 'founder' && (
                <div className="mb-6">
                   <div className="flex items-center justify-between mb-3">
                     <h2 className="text-sm font-bold text-slate-900">Management</h2>
                     <button onClick={() => setShowAddSup(!showAddSup)} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">
                       {showAddSup ? <X size={12} /> : <UserPlus size={12} />}
                       {showAddSup ? 'Cancel' : 'Add Supervisor'}
                     </button>
                   </div>
                   {showAddSup && (
                     <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                        <input className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[12px]" placeholder="Full Name" value={supName} onChange={e => setSupName(e.target.value)} />
                        <input className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[12px]" placeholder="Email" value={supEmail} onChange={e => setSupEmail(e.target.value)} autoCapitalize="none" />
                        <input className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[12px]" placeholder="Password" type="password" value={supPass} onChange={e => setSupPass(e.target.value)} />
                        <button 
                          onClick={async () => {
                            setSupLoading(true);
                            try {
                              const { data: authData } = await supabase.auth.signUp({ email: supEmail, password: supPass });
                              if (authData.user) {
                                await supabase.from('users').insert([{
                                  supabase_id: authData.user.id,
                                  name: supName,
                                  role: 'supervisor',
                                  company_id: user.company_id
                                }]);
                                setShowAddSup(false);
                                setSupName(""); setSupEmail(""); setSupPass("");
                              }
                            } catch (e) {} finally { setSupLoading(false); }
                          }}
                          className="w-full h-10 bg-blue-600 rounded-xl text-white font-bold text-xs"
                        >
                          {supLoading ? 'Creating...' : 'Create Account'}
                        </button>
                     </div>
                   )}
                </div>
              )}

              {stats.urgent > 0 && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-red-100 bg-gradient-to-r from-red-50 to-white">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="flex-1 text-xs font-medium text-red-600">
                      {stats.urgent} urgent complaint{stats.urgent > 1 ? 's' : ''} need attention
                    </span>
                    <ChevronRight size={14} className="text-red-400" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mb-8">
                <KPICard label="Pending" value={stats.pending} icon={Clock} color="#F59E0B" bg="#FEF3C7" />
                <KPICard label="Active" value={stats.active} icon={Activity} color="#2563EB" bg="#DBEAFE" />
                <KPICard label="Resolved" value={stats.resolved} icon={CheckCircle} color="#10B981" bg="#D1FAE5" />
              </div>

              <div className="mb-8 p-0.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-200 cursor-pointer active:scale-95 transition-transform">
                <div className="p-4 flex items-center gap-4 text-white">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Camera size={20} /></div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">Raise New Complaint</h3>
                    <p className="text-[10px] opacity-70">Camera-first submission</p>
                  </div>
                  <ArrowRight size={18} className="opacity-50" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-bold text-slate-900">Recent Complaints</h2>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">See All</span>
                </div>
                {complaints.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-slate-300">
                    <Inbox size={48} strokeWidth={1} />
                    <span className="text-sm font-medium">No complaints yet</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {complaints.map(c => <ComplaintCard key={c.id} complaint={c} />)}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        <div className="absolute bottom-0 inset-x-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-8 pb-4">
          <TabItem icon={Activity} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <TabItem icon={Clock} label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <TabItem icon={Bell} label="Alerts" active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} />
        </div>
        
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full"></div>
      </div>

      <div className="ml-12 max-w-sm">
        <div className="p-6 bg-white rounded-[32px] shadow-xl border border-slate-100">
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Web Sandbox</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            I have integrated **Real Supabase Auth** into this preview! You can test your credentials and see real data directly in this browser.
          </p>
          <div className="space-y-3">
            <FeatureItem icon={CheckCircle} color="text-green-600" bg="bg-green-50" title="Live Authentication" sub="Test your founder login" />
            <FeatureItem icon={Activity} color="text-blue-600" bg="bg-blue-50" title="Founder Tools" sub="Manage supervisors in the web" />
            <FeatureItem icon={Briefcase} color="text-indigo-600" bg="bg-indigo-50" title="Real Database" sub="Synced with your Supabase" />
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

const TabItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}>
    <Icon size={20} weight={active ? 'bold' : 'regular'} />
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const FeatureItem = ({ icon: Icon, color, bg, title, sub }: any) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color}`}><Icon size={18} /></div>
    <div>
      <h4 className="font-bold text-[13px] text-slate-800">{title}</h4>
      <p className="text-[11px] text-slate-500">{sub}</p>
    </div>
  </div>
);
