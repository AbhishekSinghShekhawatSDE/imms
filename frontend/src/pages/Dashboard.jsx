import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Bell, Database, CheckCircle,
    ArrowUpRight, Flame, Zap
} from 'lucide-react';
import { useMachineStore, useAlertStore, useAuthStore } from '../store';
import { machinesApi, alertsApi, dashboardApi } from '../api';
import Layout from '../layout/Layout';

const STATUS_COLORS = {
    active: 'bg-emerald-500',
    maintenance: 'bg-blue-500',
    warning: 'bg-amber-500 animate-pulse',
    critical: 'bg-rose-500 animate-pulse',
    offline: 'bg-slate-500',
};

function Dashboard() {
    const navigate = useNavigate();
    const machines = useMachineStore((state) => state.machines);
    const setMachines = useMachineStore((state) => state.setMachines);
    const summary = useMachineStore((state) => state.summary);
    const setSummary = useMachineStore((state) => state.setSummary);
    const alerts = useAlertStore((state) => state.alerts);
    const setAlerts = useAlertStore((state) => state.setAlerts);

    useEffect(() => {
        // Initial Data Fetch
        const fetchData = async () => {
            try {
                const [mRes, aRes, sRes] = await Promise.all([
                    machinesApi.list(),
                    alertsApi.list({ acknowledged: false }),
                    dashboardApi.summary()
                ]);
                setMachines(mRes.data);
                setAlerts(aRes.data);
                setSummary(sRes.data);
            } catch (err) {
                console.error('Fetch Error:', err.message);
            }
        };

        fetchData();
    }, [setMachines, setAlerts, setSummary]);

    return (
        <Layout title="Fleet intelligence" subtitle="Zone A-D Monitoring Cluster">
            <div className="space-y-10">
                {/* Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Live Assets" value={`${summary.online}/${summary.total_machines}`} icon={<Database size={16} />} color="emerald" />
                    <StatCard label="Uptime" value={`${Math.round(summary.uptime_percent || 0)}%`} trend="+0.2%" icon={<CheckCircle size={16} />} color="blue" />
                    <StatCard label="Active Alerts" value={alerts.filter(a => !a.acknowledged).length} icon={<Bell size={16} />} color={alerts.some(a => !a.acknowledged) ? 'rose' : 'emerald'} />
                    <StatCard label="Latency" value="1.2s" icon={<Activity size={16} />} color="emerald" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    {/* Machine list */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2 uppercase tracking-tight text-slate-400">
                                <Activity className="text-emerald-500" size={18} />
                                Machine Fleet Status
                            </h3>
                            <button
                                onClick={() => navigate('/machines')}
                                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                            >
                                View Detail Cluster <ArrowUpRight size={12} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {machines.map((m) => (
                                <MachineCard key={m.id} machine={m} />
                            ))}
                        </div>
                    </div>

                    {/* Alert sidebar */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2 uppercase tracking-tight text-slate-400 mb-2">
                            <Bell className="text-rose-500" size={18} />
                            Live Incident Feed
                        </h3>
                        <div className="glass-card bg-slate-900/30 overflow-hidden border-rose-500/5 shadow-2xl">
                            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {alerts.filter(a => !a.acknowledged).map(alert => (
                                    <AlertItem
                                        key={alert.id}
                                        alert={alert}
                                    />
                                ))}
                                {alerts.filter(a => !a.acknowledged).length === 0 && (
                                    <div className="p-12 text-center">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                            <CheckCircle className="text-emerald-500" size={24} />
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium">All machines operating normally</p>
                                        <p className="text-slate-600 text-[10px] uppercase font-bold mt-1 tracking-widest italic">Zero active incidents</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function StatCard({ label, value, trend, icon, color }) {
    const colorVariants = {
        emerald: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400',
        rose: 'bg-rose-500/5 border-rose-500/20 text-rose-400',
        amber: 'bg-amber-500/5 border-amber-500/20 text-amber-400',
        blue: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
    };

    return (
        <div className={`glass-card p-6 border-b-2 transition-all hover:scale-[1.02] hover:bg-white/[0.04] ${colorVariants[color] || colorVariants.emerald}`}>
            <div className="flex justify-between items-start mb-4">
                <span className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    {icon}
                </span>
                {trend && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-extrabold tracking-tighter text-white">{value}</p>
        </div>
    );
}

function MachineCard({ machine }) {
    const latest = machine.latest || { temperature: 0, vibration: 0, energy: 0 };
    const displayStatus = latest.temperature > 85 ? 'warning' : machine.status;

    return (
        <div className="glass-card hover:bg-slate-900/50 transition-all border-white/5 hover:border-white/10 overflow-hidden group">
            <div className="p-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-sm text-slate-200 tracking-tight group-hover:text-white transition-colors capitalize">{machine.name}</h4>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{machine.location}</p>
                </div>
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/5`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[displayStatus] || STATUS_COLORS.active} ${displayStatus === 'warning' && 'shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`}></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">{displayStatus}</span>
                </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-8 relative">
                <div className="space-y-4">
                    <MetricSmall label="Temp" value={latest.temperature} unit="°C" icon={<Flame size={12} />} color={parseFloat(latest.temperature) > 75 ? 'text-amber-500' : 'text-slate-400'} />
                    <MetricSmall label="Vibration" value={latest.vibration} unit="mm/s" icon={<Activity size={12} />} />
                </div>
                <div className="space-y-4">
                    <MetricSmall label="Energy" value={latest.energy} unit="kW" icon={<Zap size={12} />} />
                    <div className="h-full flex flex-col justify-end pb-1">
                        <div className="flex items-center gap-1.5">
                            <ArrowUpRight size={14} className="text-emerald-500" />
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic leading-none">Efficiency OK</span>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Activity size={80} className="text-white" />
                </div>
            </div>
        </div>
    );
}

function MetricSmall({ label, value, unit, icon, color = 'text-slate-400' }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-600">
                {icon}
                <span className="text-[10px] uppercase font-black tracking-widest shrink-0">{label}</span>
            </div>
            <p className={`text-xl font-mono font-bold tracking-tighter ${color === 'text-slate-400' ? 'text-slate-200' : color}`}>
                {value > 0 ? `${value}${unit}` : '--'}
            </p>
        </div>
    );
}

function AlertItem({ alert }) {
    const acknowledgeAlert = useAlertStore((state) => state.acknowledgeAlert);
    const user = useAuthStore((state) => state.user);

    const severityColors = {
        critical: 'border-rose-500/30 bg-rose-500/5 text-rose-500',
        warning: 'border-amber-500/30 bg-amber-500/5 text-amber-500',
        info: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500',
    };

    const handleAcknowledge = async () => {
        try {
            const engineerName = user?.name || 'Demo Engineer';
            await alertsApi.acknowledge(alert.id, engineerName);
            acknowledgeAlert(alert.id, engineerName);
        } catch (err) {
            console.error('Ack Error:', err.message);
        }
    };

    return (
        <div className={`p-4 border-l-4 transition-all hover:bg-white/[0.02] ${severityColors[alert.severity] || severityColors.info} group`}>
            <div className="flex justify-between items-start mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{alert.severity}</span>
                <span className="text-[9px] font-mono text-slate-600 font-bold">{alert.time || new Date(alert.created_at).toLocaleTimeString()}</span>
            </div>
            <h5 className="text-sm font-bold text-slate-200 group-hover:text-white mb-1 transition-colors">{alert.machine_name}</h5>
            <p className="text-xs text-slate-500 leading-relaxed font-medium mb-4">{alert.message}</p>

            <div className="flex items-center justify-between">
                <span className="text-[9px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-bold border border-white/5 uppercase tracking-widest">{alert.metric}: {alert.value}</span>
                {!alert.acknowledged && (
                    <button
                        onClick={handleAcknowledge}
                        className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-all active:scale-95"
                    >
                        Acknowledge
                    </button>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
