import { useState, useEffect, useRef } from 'react';
import { Car, AlertTriangle, Gauge, CheckCircle2, Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AlertCard } from '../components/AlertCard';
import { JunctionStatusCard } from '../components/JunctionStatusCard';
import { BengaluruMap } from '../components/BengaluruMap';

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const tick = () => {
      start = Math.min(start + step, target);
      setCurrent(Math.round(start));
      if (start < target) ref.current = setTimeout(tick, 16);
    };
    setTimeout(tick, 300);
    return () => { if (ref.current) clearTimeout(ref.current); };
  }, [target]);

  return <span>{current.toLocaleString()}{suffix}</span>;
}

const KPI_CARDS = [
  {
    label: 'Total Vehicles Today',
    value: 847000,
    suffix: '',
    display: '8.47 Lakh',
    icon: Car,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    change: '+12.4% vs yesterday',
    changeColor: 'text-red-400',
  },
  {
    label: 'Active Alerts',
    value: 14,
    suffix: '',
    display: '14',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    change: '3 Critical',
    changeColor: 'text-red-400',
  },
  {
    label: 'Avg Speed',
    value: 11,
    suffix: ' km/hr',
    display: '11 km/hr',
    icon: Gauge,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    change: '↓ 3 km/hr from baseline',
    changeColor: 'text-amber-400',
  },
  {
    label: 'Incidents Resolved',
    value: 23,
    suffix: '',
    display: '23',
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    change: 'Avg 8.4 min response',
    changeColor: 'text-green-400',
  },
];

export function Dashboard() {
  const { junctions, alerts } = useAppStore();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const featuredJunctions = junctions.filter((j) => ['silk-board', 'kr-puram', 'hebbal'].includes(j.id));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 shrink-0">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-xl border ${kpi.border} ${kpi.bg} p-4 transition-all duration-200 hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon size={16} className={kpi.color} />
                </div>
              </div>
              <div className={`text-2xl font-black ${kpi.color}`}>
                <AnimatedNumber target={kpi.value} suffix={kpi.suffix} />
              </div>
              <div className={`text-xs mt-1 ${kpi.changeColor}`}>{kpi.change}</div>
            </div>
          );
        })}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0 overflow-hidden">
        {/* Map + Junction cards */}
        <div className="flex flex-col flex-1 gap-3 min-w-0">
          {/* Map */}
          <div className="flex-1 relative min-h-[300px]">
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              <button
                onClick={() => setShowHeatmap((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                  showHeatmap
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                    : 'bg-[#1C2333] border-[#1E3A5F] text-gray-400 hover:text-white'
                }`}
              >
                <Layers size={12} />
                Heatmap {showHeatmap ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-[#161B22]/80 border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs text-gray-400">
                Click junction to drill down
              </div>
            </div>
            <BengaluruMap showHeatmap={showHeatmap} />
          </div>

          {/* Featured junction cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {featuredJunctions.map((j) => (
              <JunctionStatusCard key={j.id} junction={j} />
            ))}
          </div>
        </div>

        {/* Right panel — AI Recommendations */}
        <div className="w-80 shrink-0 flex flex-col bg-[#161B22] border border-[#1E3A5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">AI Recommendations</h2>
              <span className="text-xs text-gray-500">{activeAlerts.length} active</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Real-time AI priority feed</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <CheckCircle2 size={32} className="text-green-500/50 mb-2" />
                <p className="text-sm text-gray-500">All clear! No active alerts.</p>
              </div>
            ) : (
              activeAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
