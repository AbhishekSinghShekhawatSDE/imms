import { useState, useEffect } from 'react';
import {
    Bell, Filter, Search, CheckCircle,
    AlertTriangle, Info, Clock, Download
} from 'lucide-react';
import { alertsApi } from '../api';
import Layout from '../layout/Layout';

function AlertCenter() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        severity: '',
        acknowledged: '',
        machine: ''
    });

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await alertsApi.list(filter);
            setAlerts(res.data);
        } catch (err) {
            console.error('Fetch Alerts Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        if (filter.severity && alert.severity !== filter.severity) return false;
        if (filter.acknowledged === 'true' && !alert.acknowledged) return false;
        if (filter.acknowledged === 'false' && alert.acknowledged) return false;
        if (filter.machine && !alert.machine_name.toLowerCase().includes(filter.machine.toLowerCase())) return false;
        return true;
    });

    const handleExportCSV = () => {
        const headers = ['Timestamp', 'Machine', 'Metric', 'Severity', 'Message', 'Status'];
        const rows = filteredAlerts.map(a => [
            new Date(a.created_at).toLocaleString().replace(',', ''),
            a.machine_name,
            a.metric,
            a.severity,
            a.message.replace(',', ';'),
            a.acknowledged ? `Acknowledged by ${a.acknowledged_by}` : 'Pending'
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `imms-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchAlerts();
    }, [filter]);

    return (
        <Layout title="Alert Center" subtitle="Historical Incident Database & Audit Log">
            <div className="space-y-8">
                {/* Filter Bar */}
                <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 border-white/5 bg-slate-900/20">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search machine name..."
                                value={filter.machine}
                                onChange={(e) => setFilter({ ...filter, machine: e.target.value })}
                                className="bg-slate-950 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500/50 w-64"
                            />
                        </div>
                        <select
                            value={filter.severity}
                            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                            className="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="warning">Warning</option>
                            <option value="info">Info</option>
                        </select>
                        <select
                            value={filter.acknowledged}
                            onChange={(e) => setFilter({ ...filter, acknowledged: e.target.value })}
                            className="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">All Statuses</option>
                            <option value="true">Acknowledged</option>
                            <option value="false">Pending</option>
                        </select>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/5"
                    >
                        <Download size={14} />
                        Export Audit CSV
                    </button>
                </div>

                {/* Alerts Table */}
                <div className="glass-card overflow-hidden border-white/5 bg-slate-900/10 shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Machine</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Metric</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Severity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Message</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredAlerts.map((alert) => (
                                <tr key={alert.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                        {new Date(alert.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors uppercase">{alert.machine_name}</p>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">{alert.machine_id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 font-black uppercase tracking-widest border border-white/5">
                                            {alert.metric}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <SeverityBadge severity={alert.severity} />
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400 max-w-sm truncate">
                                        {alert.message}
                                    </td>
                                    <td className="px-6 py-4">
                                        {alert.acknowledged ? (
                                            <div className="flex items-center gap-1.5 text-emerald-500">
                                                <CheckCircle size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">ACK'D BY {alert.acknowledged_by}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-rose-500">
                                                <Clock size={12} className="animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">PENDING ACTION</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {alerts.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-500 italic text-sm">
                                        No historical logs found for the selected filters
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

function SeverityBadge({ severity }) {
    const styles = {
        critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };

    return (
        <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border ${styles[severity] || styles.info}`}>
            {severity}
        </span>
    );
}

export default AlertCenter;
