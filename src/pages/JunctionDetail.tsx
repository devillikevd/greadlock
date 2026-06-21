import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { WS_BASE_URL, API_BASE_URL } from '../config';
import { DensityGauge } from '../components/DensityGauge';
import { PredictionChart } from '../components/PredictionChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const LEVEL_COLOR: Record<string, string> = {
  LOW: '#22C55E',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
};

const LEVEL_BADGE: Record<string, string> = {
  LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_BADGE: Record<string, string> = {
  Active: 'bg-red-500/15 text-red-400',
  Resolved: 'bg-green-500/15 text-green-400',
  Pending: 'bg-amber-500/15 text-amber-400',
  open: 'bg-red-500/15 text-red-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  resolved: 'bg-green-500/15 text-green-400',
};

const AI_RECOMMENDATIONS: Record<string, string> = {
  'silk-board':
    'Emergency response required. Vehicle breakdown on Hosur Road northbound is causing cascading congestion. Recommend: (1) Deploy traffic marshals to breakdown site, (2) Extend ORR east green phase by 90s, (3) Activate variable message signs on Hosur Road southbound diversion via BTM Layout.',
  'kr-puram':
    'Moderate congestion trending downward. Peak hour relief expected by 10:30 AM. Recommend extending green phase on Whitefield Road bound traffic by 45 seconds. Monitor bridge load sensor — currently at 71% capacity.',
  'hebbal':
    'Traffic conditions are within normal parameters. No immediate action required. Predictive model suggests a mild surge (55–60%) between 10:00–10:30 AM due to IT shift overlap. Suggest proactive green extension on Bellary Road.',
  'marathahalli':
    'High-density situation with active accident clearance underway. Recommend: (1) Reroute traffic via Sarjapur Road through alternate signal coordination, (2) Extend northbound green phase by 60s until incident clears, (3) Alert BWSSB — waterlogging on service road still present.',
  'electronic-city':
    'Signal timing anomaly detected and partially auto-corrected. Full resolution pending manual verification. Hosur Road Phase 2 throughput improved by 18% post-correction. Suggest inspector field visit to verify physical signal status.',
};

export function JunctionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { junctions, alerts, deployAlert, dismissAlert } = useAppStore();
  const junction = junctions.find((j) => j.id === id);

  const [detailData, setDetailData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/junctions/${id}`);
        if (!res.ok) throw new Error("Failed to fetch details");
        const details = await res.json();
        
        // Fetch predictions
        const predRes = await fetch(`${API_BASE_URL}/junctions/${id}/predictions`);
        let predictions: any = null;
        if (predRes.ok) {
          predictions = await predRes.json();
        }

        if (!active) return;
        setDetailData(details);

        // Format readings + predictions for chart
        const readings = details.last_3_hours_readings || [];
        const formatted: any[] = readings.map((r: any) => {
          const t = new Date(r.time);
          return {
            time: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            actual: r.density_pct,
            predicted: r.density_pct,
            upper: Math.min(100, r.density_pct + 4),
            lower: Math.max(0, r.density_pct - 4),
          };
        });

        if (predictions && predictions.predictions && readings.length > 0) {
          const latestReadingTime = new Date(readings[readings.length - 1].time);
          const p = predictions.predictions;
          
          const horizons = [
            { key: '15m', mins: 15 },
            { key: '30m', mins: 30 },
            { key: '60m', mins: 60 },
            { key: '3h', mins: 180 },
          ];

          horizons.forEach((h) => {
            const predTime = new Date(latestReadingTime.getTime() + h.mins * 60 * 1000);
            const pVal = p[h.key];
            if (pVal) {
              const band = 100 - pVal.confidence;
              formatted.push({
                time: predTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                actual: null,
                predicted: pVal.density,
                upper: Math.min(100, pVal.density + band),
                lower: Math.max(0, pVal.density - band),
              });
            }
          });
        }
        setChartData(formatted);
      } catch (e) {
        console.warn("Backend junction detail offline, using mock data", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDetails();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ws = new WebSocket(`${WS_BASE_URL}/ws/${id}`);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'traffic_update' && payload.junction_id === id) {
          setDetailData((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              density: payload.density_pct,
              vehicleCount: payload.vehicle_count,
              avgSpeed: payload.avg_speed,
              level: payload.status,
              trend: payload.trend,
              lastUpdated: 'Just now',
            };
          });

          // Also update the global store
          useAppStore.setState((state) => ({
            junctions: state.junctions.map((j) =>
              j.id === id
                ? {
                    ...j,
                    density: payload.density_pct,
                    vehicleCount: payload.vehicle_count,
                    avgSpeed: payload.avg_speed,
                    level: payload.status as any,
                    trend: payload.trend as any,
                    lastUpdated: 'Just now',
                  }
                : j
            ),
          }));
        }
      } catch (err) {
        console.error("Error parsing websocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, [id]);

  const currentJunction = detailData || junction;

  if (!currentJunction) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Junction not found</p>
          <button onClick={() => navigate('/dashboard')} className="text-sky-400 hover:underline text-sm">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const color = LEVEL_COLOR[currentJunction.level];
  const laneData = currentJunction.lanes.map((l: any) => ({ name: l.name.length > 18 ? l.name.slice(0, 16) + '…' : l.name, count: l.count }));
  const alert = alerts.find((a) => (a.junction === currentJunction.id || a.junction === currentJunction.name) && !a.dismissed);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-black text-white">{currentJunction.name}</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${LEVEL_BADGE[currentJunction.level]}`}>
              {currentJunction.level}
            </span>
          </div>
          <p className="text-sm text-gray-500">{currentJunction.zone} · Updated {currentJunction.lastUpdated}</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-2xl font-black" style={{ color }}>{Math.round(currentJunction.density)}%</div>
          <div className="text-xs text-gray-500">Current density</div>
        </div>
      </div>

      {/* Top split: CCTV + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CCTV Feed */}
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E3A5F]">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-sky-400" />
              <span className="text-sm font-semibold text-white">Live CCTV Feed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-semibold">RECORDING</span>
            </div>
          </div>
          <div className="relative bg-[#0D1117] aspect-video flex items-center justify-center">
            {/* Simulated camera feed */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-[#0D1117]">
              {/* Road markings */}
              <svg className="w-full h-full" viewBox="0 0 400 225">
                <defs>
                  <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#0d0d0d" />
                  </linearGradient>
                </defs>
                <rect width="400" height="225" fill="url(#roadGrad)" />
                {/* Roads */}
                <rect x="155" y="0" width="90" height="225" fill="#222" opacity="0.8" />
                <rect x="0" y="85" width="400" height="55" fill="#222" opacity="0.8" />
                {/* Lane markings */}
                {[10, 30, 50].map((y) => (
                  <rect key={y} x="197" y={y} width="6" height="18" fill="#F59E0B" opacity="0.6" />
                ))}
                {[140, 160, 180].map((y) => (
                  <rect key={y} x="197" y={y} width="6" height="18" fill="#F59E0B" opacity="0.6" />
                ))}
                {[50, 120, 200, 270, 340].map((x) => (
                  <rect key={x} x={x} y="110" width="18" height="5" fill="#F59E0B" opacity="0.6" />
                ))}
                {/* Vehicle bounding boxes */}
                <rect x="170" y="18" width="28" height="45" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
                <text x="174" y="33" fontSize="6" fill="#22C55E">CAR</text>
                <text x="174" y="42" fontSize="5" fill="#22C55E">KA-05</text>
                <rect x="165" y="70" width="35" height="30" fill="none" stroke="#F59E0B" strokeWidth="1.5" rx="2" />
                <text x="169" y="83" fontSize="6" fill="#F59E0B">TRUCK</text>
                <rect x="60" y="92" width="28" height="20" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
                <text x="64" y="103" fontSize="6" fill="#22C55E">CAR</text>
                <rect x="100" y="95" width="22" height="16" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
                <text x="104" y="105" fontSize="5" fill="#22C55E">2W</text>
                <rect x="250" y="90" width="28" height="20" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
                <text x="254" y="101" fontSize="6" fill="#22C55E">CAR</text>
                <rect x="310" y="88" width="35" height="25" fill="none" stroke="#F97316" strokeWidth="1.5" rx="2" />
                <text x="314" y="101" fontSize="6" fill="#F97316">BUS</text>
                {/* Count overlay */}
                <rect x="5" y="5" width="75" height="20" fill="rgba(0,0,0,0.7)" rx="3" />
                <text x="10" y="17" fontSize="7" fill="#22C55E" fontFamily="monospace">Vehicles: {currentJunction.vehicleCount}</text>
                <rect x="5" y="30" width="85" height="20" fill="rgba(0,0,0,0.7)" rx="3" />
                <text x="10" y="42" fontSize="7" fill="#F59E0B" fontFamily="monospace">Avg Speed: {currentJunction.avgSpeed} km/hr</text>
                {/* Timestamp */}
                <text x="295" y="215" fontSize="7" fill="#666" fontFamily="monospace">
                  {new Date().toLocaleTimeString('en-IN', { hour12: false })} IST
                </text>
              </svg>
            </div>
          </div>
          <div className="px-4 py-2 bg-[#0D1117]/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">Camera ID: BTP-CAM-{currentJunction.id.toUpperCase().slice(0, 3)}-01</span>
            <span className="text-xs text-green-400">● Connected</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-4">
          {/* Density gauge + quick stats */}
          <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4 flex items-center gap-6">
            <DensityGauge value={currentJunction.density} size={120} />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Vehicle Count</span>
                <span className="text-sm font-bold text-white">{currentJunction.vehicleCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Avg Speed</span>
                <span className="text-sm font-bold" style={{ color }}>{currentJunction.avgSpeed} km/hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_BADGE[currentJunction.level]}`}>
                  {currentJunction.level}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Zone</span>
                <span className="text-xs text-gray-300">{currentJunction.zone}</span>
              </div>
            </div>
          </div>

          {/* Lane chart */}
          <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4 flex-1">
            <h3 className="text-sm font-semibold text-white mb-3">Lane-wise Vehicle Count</h3>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={laneData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9CA3AF', fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: '#1C2333', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#38BDF8' }}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Prediction chart */}
      <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Density Prediction — Next 3 Hours</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-red-500" />
              <span className="text-gray-500">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-sky-400 border-dashed border-t border-sky-400" />
              <span className="text-gray-500">AI Predicted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 bg-sky-400/15 rounded" />
              <span className="text-gray-500">Confidence band</span>
            </div>
          </div>
        </div>
        <PredictionChart data={chartData} />
      </div>

      {/* AI Decision + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Recommendation */}
        <div className="bg-[#161B22] border border-sky-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <span className="text-sky-400 text-xs font-bold">AI</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Recommended Action</h3>
            <span className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              94% confidence
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {alert ? alert.description : (AI_RECOMMENDATIONS[currentJunction.id || ''] || AI_RECOMMENDATIONS['silk-board'])}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => alert && deployAlert(alert.id)}
              disabled={!alert}
              className="flex-1 py-2.5 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400 text-sm font-semibold border border-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Apply Recommendation
            </button>
            <button
              onClick={() => alert && dismissAlert(alert.id)}
              disabled={!alert}
              className="py-2.5 px-4 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 text-sm font-medium border border-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              <XCircle size={16} />
              Ignore
            </button>
          </div>
        </div>

        {/* Incident log */}
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Incident Log — Today</h3>
          {!currentJunction.incidents || currentJunction.incidents.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 size={16} />
              No incidents reported today
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-[#1E3A5F]">
                    <th className="text-left pb-2 font-medium">
                      <div className="flex items-center gap-1"><Clock size={10} /> Time</div>
                    </th>
                    <th className="text-left pb-2 font-medium">Type</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-left pb-2 font-medium">
                      <div className="flex items-center gap-1"><User size={10} /> Officer</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]">
                  {currentJunction.incidents.map((inc: any) => {
                    const isNewFormat = !!inc.detected_at;
                    const timestamp = isNewFormat 
                      ? new Date(inc.detected_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                      : inc.timestamp;
                    const statusVal = isNewFormat 
                      ? (inc.status === 'open' ? 'Active' : inc.status === 'in_progress' ? 'Pending' : 'Resolved') 
                      : inc.status;
                    const typeText = isNewFormat 
                      ? (inc.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) + (inc.description ? `: ${inc.description}` : '')) 
                      : inc.type;
                    const officerName = isNewFormat 
                      ? (inc.assigned_officer_id ? `Officer #${inc.assigned_officer_id}` : 'Unassigned') 
                      : inc.officer;

                    return (
                      <tr key={inc.id} className="hover:bg-white/2">
                        <td className="py-2 text-gray-400 font-mono">{timestamp}</td>
                        <td className="py-2 text-gray-300">{typeText}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[statusVal]}`}>
                            {statusVal}
                          </span>
                        </td>
                        <td className="py-2 text-gray-400">{officerName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
