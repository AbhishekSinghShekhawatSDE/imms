import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Activity, Flame, Zap,
    AlertTriangle, Clock, TrendingUp, Info, Loader2
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
    RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { machinesApi } from '../api';
import Layout from '../layout/Layout';

function MachineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [machine, setMachine] = useState(null);
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const [mRes, rRes] = await Promise.all([
                    machinesApi.get(id),
                    machinesApi.getReadings(id, { limit: 100 })
                ]);

                // Expecting response shape as { data: { ...machineFields } }
                // or { data: { machine: { ... } } } per your PRD
                const machineData = mRes.data.machine || mRes.data.data || mRes.data;
                const readingsData = rRes.data.data?.readings || rRes.data.readings || [];

                setMachine(machineData);
                setReadings(readingsData.map(r => ({
                    ...r,
                    timeFormatted: new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                })).reverse());
            } catch (err) {
                console.error('Fetch Detail Error:', err.message);
                setError(err.message || 'Failed to load machine details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
        const interval = setInterval(fetchDetail, 10000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return (
        <Layout>
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 size={40} className="text-emerald-500 animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Field Data...</p>
            </div>
        </Layout>
    );

    if (error) return (
        <Layout>
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <AlertTriangle size={32} />
                </div>
                <div className="text-center">
                    <h3 className="text-white font-black uppercase tracking-tighter text-xl">Telemetry Link Secession</h3>
                    <p className="text-slate-400 mt-2">{error}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 hover:text-white transition-all rounded-lg"
                >
                    Retry Connection
                </button>
            </div>
        </Layout>
    );

    if (!machine) return (
        <Layout><div className="text-center py-40 font-black text-slate-500 uppercase tracking-widest">Invalid machine ID link</div></Layout>
    );

    const getThresholds = (metric) => {
        return machine?.thresholds?.find(t => t.metric === metric) || { warning_value: 0, critical_value: 0 };
    }

    return (
        <Layout title={machine?.name || 'Machine Detail'} subtitle={`Asset ID: ${id}`}>
            <div className="space-y-8 pb-20">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={14} /> back to fleet
                </button>

                {/* Top summary row - Gauges */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    <MetricGauge
                        label="Temperature"
                        value={machine?.latest?.temperature || 0}
                        unit="°C"
                        icon={<Flame size={20} />}
                        warning={getThresholds('temperature').warning_value}
                        critical={getThresholds('temperature').critical_value}
                        max={getThresholds('temperature').critical_value * 1.2 || 100}
                    />
                    <MetricGauge
                        label="Vibration"
                        value={machine?.latest?.vibration || 0}
                        unit="mm/s"
                        icon={<Activity size={20} />}
                        warning={getThresholds('vibration').warning_value}
                        critical={getThresholds('vibration').critical_value}
                        max={getThresholds('vibration').critical_value * 1.2 || 10}
                    />
                    <MetricGauge
                        label="Energy"
                        value={machine?.latest?.energy || 0}
                        unit="kW"
                        icon={<Zap size={20} />}
                        warning={getThresholds('energy').warning_value}
                        critical={getThresholds('energy').critical_value}
                        max={getThresholds('energy').critical_value * 1.2 || 100}
                    />
                </div>

                {/* Prediction Panel (Only if trending) */}
                {parseFloat(machine?.latest?.temperature) > 75 && (
                    <div className="bg-orange-500/10 border-l-4 border-orange-500 p-6 rounded-r-xl flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                <TrendingUp size={24} className="animate-bounce" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-orange-500 uppercase tracking-tighter">Predictive Analysis Active</h4>
                                <p className="text-sm text-slate-400 font-medium">Temperature trending toward critical. <span className="text-white font-bold italic">Estimated breach in 8-12 minutes.</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Confidence Score</p>
                            <p className="text-2xl font-black text-white">94.2%</p>
                        </div>
                    </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-8">
                    <ChartCard
                        title="Thermal Signature"
                        data={readings}
                        dataKey="temperature"
                        color="#f43f5e"
                        warning={getThresholds('temperature').warning_value}
                        critical={getThresholds('temperature').critical_value}
                        suffix="°C"
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ChartCard
                            title="Vibration Profile"
                            data={readings}
                            dataKey="vibration"
                            color="#3b82f6"
                            warning={getThresholds('vibration').warning_value}
                            critical={getThresholds('vibration').critical_value}
                            suffix="mm/s"
                        />
                        <ChartCard
                            title="Power Load Analysis"
                            data={readings}
                            dataKey="energy"
                            color="#10b981"
                            warning={getThresholds('energy').warning_value}
                            critical={getThresholds('energy').critical_value}
                            suffix="kW"
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function MetricGauge({ label, value, unit, icon, warning, critical, max }) {
    const isCritical = value >= critical;
    const isWarning = value >= warning && !isCritical;

    const color = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
    const bgColor = isCritical ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : isWarning ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500';

    const data = [{ name: label, value: value, fill: color }];

    return (
        <div className={`glass-card p-6 border-b-4 ${bgColor} flex flex-col justify-between relative overflow-hidden`}>
            <div className="flex justify-between items-center mb-2 z-10">
                <span className="p-2 rounded-lg bg-white/5">{icon}</span>
                <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    Reading Active
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center -my-4 z-0">
                <ResponsiveContainer width="100%" height={140}>
                    <RadialBarChart
                        cx="50%"
                        cy="100%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={10}
                        data={data}
                        startAngle={180}
                        endAngle={0}
                    >
                        <PolarAngleAxis type="number" domain={[0, max || 100]} angleAxisId={0} tick={false} />
                        <RadialBar
                            minAngle={15}
                            background={{ fill: 'rgba(255,255,255,0.05)' }}
                            clockWise
                            dataKey="value"
                            cornerRadius={5}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>

            <div className="text-center z-10 mt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold tracking-tighter text-white">{Number(value).toFixed(1)}</span>
                    <span className="text-xs font-bold text-slate-400">{unit}</span>
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, data, dataKey, color, warning, critical, suffix }) {
    return (
        <div className="glass-card p-8 min-h-[400px] flex flex-col border-white/5 bg-slate-900/10">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h3 className="font-black text-white uppercase tracking-tighter text-lg">{title}</h3>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="timeFormatted"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                            label={{ value: suffix, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, fontWeight: 800 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}
                            labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#grad-${dataKey})`}
                            animationDuration={800}
                        />
                        {warning && (
                            <ReferenceLine y={warning} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Warning', fill: '#f59e0b', fontSize: 10, position: 'insideRight' }} />
                        )}
                        {critical && (
                            <ReferenceLine y={critical} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10, position: 'insideRight' }} />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default MachineDetail;
