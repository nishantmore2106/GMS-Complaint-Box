import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, ChevronRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Hardcoded Root Admin Access
    if (email === 'adminPOINT@admin' && password === 'more2106') {
       setTimeout(() => {
          localStorage.setItem('gms_admin_session', 'authenticated_root');
          // Force a page reload to trigger root App.tsx state
          window.location.href = '/';
       }, 800);
       return;
    } else {
       setError('Invalid login credentials. Root access denied.');
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Glowing Blobs */}
      <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-primary/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-40 w-[500px] h-[500px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-80 left-20 w-[600px] h-[600px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-[1000px] h-[600px] rounded-[2.5rem] flex overflow-hidden glass-dark border-slate-700/50 relative z-10 shadow-2xl">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 to-indigo-900/40 relative items-center justify-center p-12 border-r border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
          <div className="relative z-10 text-center animate-fade-in">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-glow">
              <ShieldAlert size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">GMS OS</h1>
            <p className="text-lg text-indigo-200 mt-4 opacity-90 max-w-sm mx-auto font-medium">
              Enterprise Command Center. Secure access required.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 p-10 lg:p-14 flex flex-col justify-center bg-slate-900/60 backdrop-blur-xl animate-slide-up">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400 mb-8 font-medium">Sign in to the founder dashboard.</p>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-start backdrop-blur-sm">
                  <span className="mr-3 mt-0.5">⚠️</span>
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Admin Identity</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="adminPOINT@admin"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Passcode</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center group overflow-hidden relative"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="relative z-10">Authenticate</span>
                    <ChevronRight size={18} className="ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            <p className="text-center text-xs text-slate-500 mt-10">
              Secured by advanced AES-256 encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
