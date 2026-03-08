import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, ArrowRight, Database,
    Settings, Shield, Zap, Flame
} from 'lucide-react';
import { useMachineStore } from '../store';
import { machinesApi } from '../api';
import Layout from '../layout/Layout';

const STATUS_VARIANTS = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    maintenance: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    offline: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

function MachineList() {
    const navigate = useNavigate();
    const machines = useMachineStore((state) => state.machines);
    const setMachines = useMachineStore((state) => state.setMachines);

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                const res = await machinesApi.list();
                setMachines(res.data);
            } catch (err) {
                console.error('Fetch Machines Error:', err.message);
            }
        };
        fetchMachines();
    }, [setMachines]);

    return (
        <Layout title="Asset Inventory" subtitle="Comprehensive Machine Fleet & Telemetry Overview">
            <div className="space-y-6">
                <div className="glass-card overflow-hidden border-white/5 bg-slate-900/10 shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type / Location</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Temperature</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Vibration</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Energy</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {machines.map((m) => (
                                <tr
                                    key={m.id}
                                    onClick={() => navigate(`/machines/${m.id}`)}
                                    className="hover:bg-white/[0.02] transition-all group cursor-pointer"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                                                <Database size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-200 uppercase tracking-tight">{m.name}</p>
                                                <p className="text-[10px] font-mono text-slate-600 uppercase">{m.id.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.type}</p>
                                        <p className="text-xs text-slate-600 font-medium">{m.location}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border ${STATUS_VARIANTS[m.status] || STATUS_VARIANTS.active}`}>
                                                {m.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 text-slate-200">
                                                <span className="text-sm font-mono font-bold">{m.latest?.temperature || '--'}</span>
                                                <span className="text-[10px] text-slate-500">°C</span>
                                            </div>
                                            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{ width: `${Math.min((m.latest?.temperature || 0) / 1, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-slate-200">
                                            <Activity size={12} className="text-blue-500" />
                                            <span className="text-sm font-mono font-bold">{m.latest?.vibration || '--'}</span>
                                            <span className="text-[10px] text-slate-500">mm/s</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-slate-200">
                                            <Zap size={12} className="text-amber-500" />
                                            <span className="text-sm font-mono font-bold">{m.latest?.energy || '--'}</span>
                                            <span className="text-[10px] text-slate-500">kW</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-emerald-500 hover:border-emerald-500/30">
                                            <ArrowRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

export default MachineList;
