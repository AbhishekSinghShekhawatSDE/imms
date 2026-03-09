import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Activity, Bell, Settings, LayoutDashboard,
    Database, AlertTriangle, Shield
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAlertStore, useAuthStore } from '../store';

function Layout({ children, title, subtitle }) {
    const { isConnected } = useWebSocket();
    const alerts = useAlertStore((state) => state.alerts);
    const auth = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => setSystemTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
        { icon: <Database size={18} />, label: 'Machines', path: '/machines' },
        { icon: <AlertTriangle size={18} />, label: 'Alert Center', path: '/alerts', badge: alerts.filter(a => !a.acknowledged).length },
        { icon: <Settings size={18} />, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row text-slate-100 bg-[#020617] font-sans selection:bg-emerald-500/30">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] border-r border-white/5 flex-col p-6 space-y-8 bg-slate-950/40 backdrop-blur-xl z-50 overflow-y-auto">
                <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight leading-none text-white">IMMS</h2>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Industrial v1.0</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {menuItems.map((item) => (
                        <NavItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            active={location.pathname === item.path}
                            badge={item.badge > 0 ? item.badge : null}
                            onClick={() => navigate(item.path)}
                        />
                    ))}
                </nav>

                <div className="pt-6 border-t border-white/5 px-2">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {auth.user?.name.split(' ').map(n => n[0]).join('') || 'DE'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-slate-200 truncate">{auth.user?.name || 'Abhishek Eng.'}</p>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{isConnected ? 'ONLINE' : 'OFFLINE'}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => auth.logout()}
                        className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-rose-500 transition-colors py-2"
                    >
                        Terminal Disconnect
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-0 md:ml-[220px] pb-[58px] md:pb-0 flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 bg-slate-950/20 backdrop-blur-md shrink-0">
                    <div>
                        <h1 className="text-sm md:text-2xl font-bold text-white tracking-tight capitalize">{title || 'Fleet Intelligence'}</h1>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-wide">{subtitle || 'Zone A-D Monitoring Cluster'}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex gap-4 items-center">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Status</span>
                                <span className="text-sm font-mono text-emerald-400">NORMAL OPS</span>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">System Time</p>
                            <p className="text-sm font-mono text-slate-200">{systemTime} <span className="text-slate-600 font-sans ml-1 text-xs">IST</span></p>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <section className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                    {children}
                </section>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-[58px] bg-slate-950 border-t border-white/5 z-50 flex-row items-stretch">
                <button
                    className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-tighter ${location.pathname === '/' ? 'text-emerald-500' : 'text-slate-500'}`}
                    onClick={() => navigate('/')}
                >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </button>
                <button
                    className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-tighter ${location.pathname === '/machines' ? 'text-emerald-500' : 'text-slate-500'}`}
                    onClick={() => navigate('/machines')}
                >
                    <Database size={18} />
                    <span>Machines</span>
                </button>
                <button
                    className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-tighter ${location.pathname === '/alerts' ? 'text-emerald-500' : 'text-slate-500'}`}
                    onClick={() => navigate('/alerts')}
                >
                    <div className="relative">
                        <AlertTriangle size={18} />
                        {menuItems.find(i => i.path === '/alerts')?.badge > 0 && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></div>
                        )}
                    </div>
                    <span>Alerts</span>
                </button>
                <button
                    className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-tighter ${location.pathname === '/settings' ? 'text-emerald-500' : 'text-slate-500'}`}
                    onClick={() => navigate('/settings')}
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
            </nav>
        </div>
    );
}

function NavItem({ icon, label, active, badge, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-200'}`}
        >
            <div className="flex items-center gap-3 relative z-10">
                <span className={`${active ? 'text-emerald-500' : 'text-slate-600 group-hover:text-slate-300'} transition-colors`}>{icon}</span>
                {label}
            </div>
            {badge && (
                <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-lg font-black relative z-10 shadow-lg shadow-rose-900/40 animate-pulse">
                    {badge}
                </span>
            )}
            {active && <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500"></div>}
        </button>
    );
}

export default Layout;
