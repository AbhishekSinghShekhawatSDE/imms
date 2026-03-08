import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, ArrowRight } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store';

function Login() {
    const [email, setEmail] = useState('engineer@imms.demo');
    const [password, setPassword] = useState('imms2026');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await authApi.login(email, password);
            setAuth(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 font-sans p-6 overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/20 mb-6">
                        <Activity size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">IMMS ACCESS</h1>
                    <p className="text-slate-500 font-medium text-sm">Industrial Machine Monitoring System v1.0</p>
                </div>

                <div className="glass-card p-8 border-white/5 bg-slate-900/40 backdrop-blur-2xl shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-1">Control Credentials</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-sm placeholder:text-slate-700"
                                placeholder="Station ID (Email)"
                                required
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-sm placeholder:text-slate-700"
                                placeholder="Secure Key (Password)"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-500 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : (
                                <>
                                    Engage Station <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-slate-600">
                    <ShieldCheck size={14} className="text-emerald-500/50" />
                    <p className="text-[10px] font-black uppercase tracking-[0.15em]">Secure Terminal Protocol 42.9</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
