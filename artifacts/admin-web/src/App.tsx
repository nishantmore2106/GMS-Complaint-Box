import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import SystemControls from './pages/SystemControls';
import Issues from './pages/Issues';
import Logs from './pages/Logs';
import Broadcast from './pages/Broadcast';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for hardcoded root admin bypass FIRST
    const localAdminSession = localStorage.getItem('gms_admin_session');
    if (localAdminSession === 'authenticated_root') {
       setSession({ user: { role: 'founder_root' } });
       setLoading(false);
       return;
    }

    // Fallback to normal Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('gms_admin_session')) {
         setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/" 
          element={session ? <DashboardLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Overview />} />
          <Route path="controls" element={<SystemControls />} />
          <Route path="issues" element={<Issues />} />
          <Route path="logs" element={<Logs />} />
          <Route path="broadcast" element={<Broadcast />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
