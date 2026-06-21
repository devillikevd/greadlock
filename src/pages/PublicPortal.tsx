import { useAppStore } from '../store/useAppStore';
import { MessageCircle, TrafficCone, Eye } from 'lucide-react';

const INCIDENTS = [
  '09:42 · Silk Board — Vehicle breakdown on Hosur Road NB · ACTIVE',
  '09:32 · Marathahalli — Minor accident, right lane blocked · ACTIVE',
  '09:05 · Electronic City — Signal timing issue · UNDER REVIEW',
  '08:45 · Hebbal — Heavy rainfall advisory lifted · RESOLVED',
  '08:20 · KR Puram — Peak hour congestion advisory · RESOLVED',
  '08:15 · Silk Board — Signal fault repaired · RESOLVED',
];

const ZONE_STATUS = [
  { name: 'South Bengaluru', density: '82%', status: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', desc: 'Silk Board & EC corridors congested' },
  { name: 'East Bengaluru', density: '74%', status: 'MEDIUM', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', desc: 'Marathahalli & KR Puram moderate flow' },
  { name: 'North Bengaluru', density: '45%', status: 'LOW', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', desc: 'Hebbal & Bellary Road clear' },
];

export function PublicPortal() {
  const { junctions } = useAppStore();
  const featuredJunctions = junctions.filter((j) => ['silk-board', 'marathahalli', 'hebbal'].includes(j.id));

  const LEVEL_COLOR: Record<string, string> = {
    LOW: '#22C55E', MEDIUM: '#F59E0B', HIGH: '#F97316', CRITICAL: '#EF4444',
  };

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Public navbar */}
      <nav className="h-14 bg-[#161B22] border-b border-[#1E3A5F] flex items-center px-6 gap-4">
        <div className="flex items-center gap-3">
          <TrafficCone size={20} className="text-sky-400" />
          <span className="font-bold text-white text-sm">AI Traffic Copilot</span>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Eye size={12} />
            Public View — Read Only
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-gray-500">
          Bengaluru Smart City · {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white">Bengaluru Live Traffic Status</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time traffic intelligence for Bengaluru citizens — updated every 60 seconds</p>
        </div>

        {/* Zone overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ZONE_STATUS.map((zone) => (
            <div key={zone.name} className={`bg-[#161B22] border ${zone.border} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{zone.name}</h3>
                <span className={`text-xs font-bold ${zone.color} ${zone.bg} px-2 py-0.5 rounded-full border ${zone.border}`}>
                  {zone.status}
                </span>
              </div>
              <div className={`text-3xl font-black ${zone.color} mb-1`}>{zone.density}</div>
              <p className="text-xs text-gray-500">{zone.desc}</p>
            </div>
          ))}
        </div>

        {/* City map (read-only) */}
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E3A5F] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Live Traffic Map</h3>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Updated just now
            </span>
          </div>
          <div className="p-4">
            <svg viewBox="0 0 100 80" className="w-full max-h-72">
              <defs>
                <pattern id="pgrid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1E3A5F" strokeWidth="0.15" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="80" fill="url(#pgrid)" />
              <path
                d="M20,8 Q30,4 45,6 Q58,4 68,10 Q78,16 80,28 Q84,42 78,54 Q72,64 60,70 Q48,76 36,73 Q22,70 15,58 Q8,44 10,30 Z"
                fill="#131920" stroke="#1E3A5F" strokeWidth="0.4"
              />
              <path d="M32,0 L35,12 L42,30 L46,54" stroke="#1E3A5F" strokeWidth="0.8" fill="none" opacity="0.5" />
              <ellipse cx="50" cy="40" rx="26" ry="22" fill="none" stroke="#1E3A5F" strokeWidth="0.7" opacity="0.5" />
              <path d="M20,22 L38,24 L55,22 L72,16" stroke="#1E3A5F" strokeWidth="0.6" fill="none" opacity="0.4" />

              {junctions.map((j) => {
                const positions: Record<string, { x: number; y: number }> = {
                  'hebbal': { x: 33, y: 10 },
                  'kr-puram': { x: 65, y: 22 },
                  'marathahalli': { x: 70, y: 40 },
                  'silk-board': { x: 48, y: 56 },
                  'electronic-city': { x: 44, y: 70 },
                };
                const pos = positions[j.id];
                if (!pos) return null;
                const color = LEVEL_COLOR[j.level];
                return (
                  <g key={j.id}>
                    <circle cx={pos.x} cy={pos.y} r="3" fill={color} opacity="0.85" />
                    {j.level === 'CRITICAL' && (
                      <circle cx={pos.x} cy={pos.y} r="5" fill={color} opacity="0.2">
                        <animate attributeName="r" values="3;8;3" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <text x={pos.x + 4} y={pos.y - 2} fontSize="3" fill="white" opacity="0.8" fontFamily="Inter">
                      {j.name.split(' ')[0]} {j.density}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Junction cards */}
        <div>
          <h2 className="text-base font-bold text-white mb-3">Key Junction Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredJunctions.map((j) => {
              const color = LEVEL_COLOR[j.level];
              const BADGE: Record<string, string> = {
                LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
                MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
              };
              return (
                <div key={j.id} className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">{j.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${BADGE[j.level]}`}>{j.level}</span>
                  </div>
                  <div className="text-3xl font-black mb-1" style={{ color }}>{j.density}%</div>
                  <div className="text-xs text-gray-500">~{j.vehicleCount.toLocaleString()} vehicles · {j.avgSpeed} km/hr avg</div>
                  <div className="text-xs text-gray-600 mt-1">Updated {j.lastUpdated}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center shrink-0">
            <MessageCircle size={28} className="text-green-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-white">Get Live Traffic Updates on WhatsApp</h3>
            <p className="text-sm text-gray-400 mt-0.5">Chat with our AI bot for personalised traffic updates, route suggestions, and incident alerts in Kannada, Hindi, or English.</p>
          </div>
          <button className="shrink-0 px-5 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg shadow-green-500/20">
            <MessageCircle size={16} />
            Chat on WhatsApp
          </button>
        </div>

        {/* Incident ticker */}
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-[#1E3A5F] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-400">INCIDENT TICKER</span>
          </div>
          <div className="py-3 overflow-hidden">
            <div
              className="whitespace-nowrap text-xs text-gray-400 inline-block"
              style={{ animation: 'ticker 35s linear infinite' }}
            >
              {INCIDENTS.map((inc, i) => (
                <span key={i} className="mr-12">
                  <span className="text-amber-400 font-medium">●</span> {inc}
                </span>
              ))}
              {INCIDENTS.map((inc, i) => (
                <span key={`r${i}`} className="mr-12">
                  <span className="text-amber-400 font-medium">●</span> {inc}
                </span>
              ))}
            </div>
          </div>
        </div>

        <footer className="text-center text-xs text-gray-700 pb-4">
          Bengaluru Traffic Police · BBMP Smart City Division · Data refreshes every 60 seconds
        </footer>
      </div>
    </div>
  );
}
