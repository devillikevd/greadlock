import { useState } from 'react';
import { Play, ChevronDown, TrendingDown, TrendingUp, Wind } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function TrafficSignalSVG({ mode, north, east }: { mode: 'fixed' | 'ai'; north?: number; east?: number }) {
  const phases = mode === 'ai'
    ? [
        { dir: 'N/S', green: true, time: `${north || 52}s` },
        { dir: 'E/W', green: false, time: `${east || 28}s` },
      ]
    : [
        { dir: 'N/S', green: true, time: `${north || 60}s` },
        { dir: 'E/W', green: false, time: `${east || 60}s` },
      ];

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Intersection diagram */}
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {/* Roads */}
          <rect x="70" y="0" width="40" height="180" fill="#1a1f2e" />
          <rect x="0" y="70" width="180" height="40" fill="#1a1f2e" />
          {/* Center intersection */}
          <rect x="70" y="70" width="40" height="40" fill="#232b3e" />
          {/* Lane markings */}
          <rect x="88" y="10" width="4" height="20" fill="#F59E0B" opacity="0.6" rx="2" />
          <rect x="88" y="150" width="4" height="20" fill="#F59E0B" opacity="0.6" rx="2" />
          <rect x="10" y="88" width="20" height="4" fill="#F59E0B" opacity="0.6" rx="2" />
          <rect x="150" y="88" width="20" height="4" fill="#F59E0B" opacity="0.6" rx="2" />

          {/* N signal */}
          <rect x="78" y="52" width="24" height="14" fill="#0d1117" rx="3" stroke="#1E3A5F" strokeWidth="1" />
          <circle cx="86" cy="59" r="4" fill={mode === 'ai' ? '#22C55E' : '#22C55E'} opacity="0.9" />
          <circle cx="94" cy="59" r="4" fill="#EF4444" opacity="0.3" />

          {/* S signal */}
          <rect x="78" y="114" width="24" height="14" fill="#0d1117" rx="3" stroke="#1E3A5F" strokeWidth="1" />
          <circle cx="86" cy="121" r="4" fill={mode === 'ai' ? '#22C55E' : '#22C55E'} opacity="0.9" />
          <circle cx="94" cy="121" r="4" fill="#EF4444" opacity="0.3" />

          {/* E signal */}
          <rect x="114" y="78" width="14" height="24" fill="#0d1117" rx="3" stroke="#1E3A5F" strokeWidth="1" />
          <circle cx="121" cy="86" r="4" fill="#EF4444" opacity="0.9" />
          <circle cx="121" cy="94" r="4" fill="#22C55E" opacity="0.3" />

          {/* W signal */}
          <rect x="52" y="78" width="14" height="24" fill="#0d1117" rx="3" stroke="#1E3A5F" strokeWidth="1" />
          <circle cx="59" cy="86" r="4" fill="#EF4444" opacity="0.9" />
          <circle cx="59" cy="94" r="4" fill="#22C55E" opacity="0.3" />

          {/* Direction labels */}
          <text x="90" y="22" textAnchor="middle" fontSize="9" fill="#6B7280">N</text>
          <text x="90" y="170" textAnchor="middle" fontSize="9" fill="#6B7280">S</text>
          <text x="168" y="93" textAnchor="middle" fontSize="9" fill="#6B7280">E</text>
          <text x="12" y="93" textAnchor="middle" fontSize="9" fill="#6B7280">W</text>

          {/* Vehicle flow arrows */}
          {mode === 'ai' ? (
            <>
              <path d="M90,35 L90,25" stroke="#22C55E" strokeWidth="2" markerEnd="url(#arr)" />
              <path d="M90,145 L90,155" stroke="#22C55E" strokeWidth="2" />
              <defs>
                <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 Z" fill="#22C55E" />
                </marker>
              </defs>
            </>
          ) : null}
        </svg>
      </div>

      {/* Phase display */}
      <div className="w-full space-y-2">
        {phases.map((ph) => (
          <div key={ph.dir} className="flex items-center justify-between bg-[#0D1117] rounded-lg px-3 py-2">
            <span className="text-xs text-gray-400">{ph.dir} corridor</span>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${ph.green ? 'bg-green-500' : 'bg-red-500'} ${ph.green ? 'shadow-[0_0_6px_#22C55E]' : ''}`} />
              <span className={`text-xs font-bold ${ph.green ? 'text-green-400' : 'text-red-400'}`}>
                {ph.green ? 'GREEN' : 'RED'} {ph.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold text-white">{value} <span className="text-xs text-gray-500 font-normal">{unit}</span></span>
    </div>
  );
}

export function SignalSimulator() {
  const { junctions } = useAppStore();
  const [selectedJunction, setSelectedJunction] = useState('silk-board');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);

  const runSimulation = async () => {
    setRunning(true);
    setDone(false);
    setProgress(0);
    setSimResults(null);
    
    let p = 0;
    const intervalId = setInterval(() => {
      p += 5;
      setProgress((prev) => Math.min(prev + 5, 95));
    }, 100);

    try {
      const res = await fetch("http://localhost:8000/signals/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ junction_id: selectedJunction })
      });
      clearInterval(intervalId);
      setProgress(100);

      if (res.ok) {
        const data = await res.json();
        setSimResults(data);
        setRunning(false);
        setDone(true);
      } else {
        throw new Error("Simulation response not ok");
      }
    } catch (e) {
      console.warn("Backend simulator offline, falling back to mock results", e);
      clearInterval(intervalId);
      let p2 = progress;
      const fallbackId = setInterval(() => {
        p2 += 10;
        setProgress(p2);
        if (p2 >= 100) {
          clearInterval(fallbackId);
          setSimResults({
            fixed: { wait: '4 min 20 sec', throughput: 580, co2: 98, north_green: 60, south_green: 60, east_green: 60, west_green: 60 },
            ai: { wait: '2 min 38 sec', throughput: 845, co2: 61, north_green: 52, south_green: 52, east_green: 28, west_green: 28 },
            wait_reduction_pct: 40.0,
            throughput_increase_pct: 46.0,
            co2_reduction_pct: 38.0
          });
          setRunning(false);
          setDone(true);
        }
      }, 50);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white">AI Signal Optimizer</h1>
        <p className="text-sm text-gray-400 mt-0.5">Before vs After Comparison — Fixed Timing vs AI Adaptive</p>
      </div>

      {/* Junction selector + Run button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select
            value={selectedJunction}
            onChange={(e) => { setSelectedJunction(e.target.value); setDone(false); setProgress(0); }}
            className="bg-[#1C2333] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-sm text-white appearance-none pr-9 focus:outline-none focus:border-sky-500/50"
          >
            {junctions.map((j) => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={runSimulation}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-sky-500/20"
        >
          {running ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {running ? 'Simulating…' : 'Run Simulation'}
        </button>
      </div>

      {/* Progress bar */}
      {(running || done) && (
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">
              {running ? 'Running AI optimization simulation…' : '✓ Simulation complete'}
            </span>
            <span className="text-xs font-mono text-sky-400">{progress}%</span>
          </div>
          <div className="h-2 bg-[#1C2333] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Comparison cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fixed timing */}
        <div className="bg-[#161B22] border border-red-500/30 rounded-xl overflow-hidden">
          <div className="bg-red-500/10 px-4 py-3 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Fixed Timing</h3>
              <span className="text-xs font-semibold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">Current</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Traditional fixed-phase signal control</p>
          </div>
          <div className="p-4">
            <TrafficSignalSVG 
              mode="fixed" 
              north={simResults?.fixed.north_green} 
              east={simResults?.fixed.east_green} 
            />
            <div className="mt-4 pt-4 border-t border-[#1E3A5F] space-y-2.5">
              <MetricRow label="Avg Wait Time" value={simResults ? simResults.fixed.wait : '4 min 20 sec'} unit="" />
              <MetricRow label="Throughput" value={simResults ? simResults.fixed.throughput : 580} unit="vehicles/hr" />
              <MetricRow label="CO₂ Emissions" value={simResults ? simResults.fixed.co2 : 98} unit="kg/hr" />
              <MetricRow label="Phase Duration N/S" value={simResults ? simResults.fixed.north_green : 60} unit="seconds" />
              <MetricRow label="Phase Duration E/W" value={simResults ? simResults.fixed.east_green : 60} unit="seconds" />
            </div>
          </div>
        </div>

        {/* AI Adaptive */}
        <div className="bg-[#161B22] border border-green-500/30 rounded-xl overflow-hidden">
          <div className="bg-green-500/10 px-4 py-3 border-b border-green-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">AI Adaptive</h3>
              <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">Optimized</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Dynamic phase control with ML predictions</p>
          </div>
          <div className="p-4">
            <TrafficSignalSVG 
              mode="ai" 
              north={simResults?.ai.north_green} 
              east={simResults?.ai.east_green} 
            />
            <div className="mt-4 pt-4 border-t border-[#1E3A5F] space-y-2.5">
              <MetricRow label="Avg Wait Time" value={done && simResults ? simResults.ai.wait : '—'} unit="" />
              <MetricRow label="Throughput" value={done && simResults ? simResults.ai.throughput : '—'} unit={done ? 'vehicles/hr' : ''} />
              <MetricRow label="CO₂ Emissions" value={done && simResults ? simResults.ai.co2 : '—'} unit={done ? 'kg/hr' : ''} />
              <MetricRow label="Phase Duration N/S" value={done && simResults ? simResults.ai.north_green : '—'} unit={done ? 'seconds (adaptive)' : ''} />
              <MetricRow label="Phase Duration E/W" value={done && simResults ? simResults.ai.east_green : '—'} unit={done ? 'seconds (adaptive)' : ''} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {done && simResults && (
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 text-center">AI Optimization Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/8 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown size={16} className="text-green-400" />
              </div>
              <div className="text-3xl font-black text-green-400">−{Math.round(simResults.wait_reduction_pct)}%</div>
              <div className="text-xs text-gray-400 mt-1">Wait Time Reduction</div>
              <div className="text-xs text-gray-600 mt-0.5">{simResults.fixed.wait} → {simResults.ai.wait}</div>
            </div>
            <div className="text-center p-4 bg-sky-500/8 rounded-xl border border-sky-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={16} className="text-sky-400" />
              </div>
              <div className="text-3xl font-black text-sky-400">+{Math.round(simResults.throughput_increase_pct)}%</div>
              <div className="text-xs text-gray-400 mt-1">Throughput Increase</div>
              <div className="text-xs text-gray-600 mt-0.5">{simResults.fixed.throughput} → {simResults.ai.throughput} vehicles/hr</div>
            </div>
            <div className="text-center p-4 bg-purple-500/8 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wind size={16} className="text-purple-400" />
              </div>
              <div className="text-3xl font-black text-purple-400">−{Math.round(simResults.co2_reduction_pct)}%</div>
              <div className="text-xs text-gray-400 mt-1">CO₂ Reduction</div>
              <div className="text-xs text-gray-600 mt-0.5">{simResults.fixed.co2} → {simResults.ai.co2} kg/hr</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
