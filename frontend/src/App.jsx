import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MachineList from './pages/MachineList';
import MachineDetail from './pages/MachineDetail';
import AlertCenter from './pages/AlertCenter';
import Layout from './layout/Layout';
import { useAuthStore } from './store';

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={token ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/machines"
          element={token ? <MachineList /> : <Navigate to="/login" />}
        />
        <Route
          path="/machines/:id"
          element={token ? <MachineDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/alerts"
          element={token ? <AlertCenter /> : <Navigate to="/login" />}
        />
        <Route path="/settings" element={
          <Layout title="System Settings" subtitle="Global Configuration & Threshold Policy">
            <div className="flex items-center justify-center py-40">
              <div className="text-center">
                <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 inline-block mb-4">
                  <Settings className="text-slate-500 w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                  System Configuration
                </p>
                <p className="text-slate-600 text-[10px] mt-2 font-medium">
                  Remote threshold management and notification policy engine available in v1.1
                </p>
              </div>
            </div>
          </Layout>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
