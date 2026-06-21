import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, FileText } from 'lucide-react';

const hourlyData = [
  { time: '06:00', vehicles: 12400, incidents: 1 },
  { time: '07:00', vehicles: 48200, incidents: 3 },
  { time: '07:30', vehicles: 68900, incidents: 5 },
  { time: '08:00', vehicles: 89400, incidents: 8 },
  { time: '08:30', vehicles: 104200, incidents: 6 },
  { time: '09:00', vehicles: 118700, incidents: 4 },
  { time: '09:30', vehicles: 112300, incidents: 3 },
  { time: '10:00', vehicles: 98500, incidents: 2 },
  { time: '10:30', vehicles: 84200, incidents: 1 },
  { time: '11:00', vehicles: 71600, incidents: 1 },
];

const junctionLoad = [
  { junction: 'Silk Board', density: 94, throughput: 2847 },
  { junction: 'Marathahalli', density: 82, throughput: 2103 },
  { junction: 'E-City', density: 71, throughput: 1687 },
  { junction: 'KR Puram', density: 67, throughput: 1543 },
  { junction: 'Hebbal', density: 45, throughput: 892 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C2333] border border-[#1E3A5F] rounded-lg p-3 text-xs">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export function Reports() {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Traffic Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Daily summary — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-sm font-semibold border border-sky-500/30 transition-all">
          <Download size={14} />
          Export PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Vehicles', value: '8.47 Lakh', change: '+12.4%', color: 'text-sky-400' },
          { label: 'Peak Hour Load', value: '1.18 Lakh/hr', change: '08:00–09:00 AM', color: 'text-orange-400' },
          { label: 'Avg Journey Time', value: '+38 min', change: '↑ vs 22 min baseline', color: 'text-red-400' },
          { label: 'AI Optimizations', value: '142', change: 'Signal adjustments today', color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Hourly Vehicle Flow</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="vehicles" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Vehicles" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Junction Density Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={junctionLoad} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis dataKey="junction" type="category" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="density" name="Density %" radius={[0, 4, 4, 0]}
                fill="url(#densityGrad)"
              >
                <defs>
                  <linearGradient id="densityGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Incidents & Vehicle Flow — Correlation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourlyData} margin={{ left: -15, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
              <Line yAxisId="left" type="monotone" dataKey="vehicles" stroke="#38BDF8" strokeWidth={2} dot={false} name="Vehicles" />
              <Line yAxisId="right" type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, fill: '#EF4444' }} name="Incidents" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent reports */}
      <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Saved Reports</h3>
        <div className="space-y-2">
          {[
            { name: 'Daily Traffic Summary — 19 Jun 2026', size: '2.4 MB', type: 'PDF' },
            { name: 'Weekly Peak Analysis — Week 24, 2026', size: '5.1 MB', type: 'PDF' },
            { name: 'Silk Board Incident Report — 18 Jun 2026', size: '890 KB', type: 'PDF' },
            { name: 'AI Signal Optimization Results — Jun 2026', size: '3.2 MB', type: 'XLSX' },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-sky-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{r.name}</p>
                <p className="text-xs text-gray-500">{r.type} · {r.size}</p>
              </div>
              <button className="text-xs text-sky-400 hover:text-sky-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-sky-500/10">
                <Download size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
