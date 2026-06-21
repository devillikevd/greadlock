import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DEFAULT_MOCK_DATA = [
  { time: '07:00', actual: 45, predicted: 45, upper: 50, lower: 40 },
  { time: '07:30', actual: 58, predicted: 58, upper: 65, lower: 51 },
  { time: '08:00', actual: 74, predicted: 74, upper: 82, lower: 66 },
  { time: '08:30', actual: 86, predicted: 87, upper: 93, lower: 79 },
  { time: '09:00', actual: 94, predicted: 92, upper: 98, lower: 86 },
  { time: '09:30', actual: null, predicted: 89, upper: 96, lower: 82 },
  { time: '10:00', actual: null, predicted: 84, upper: 92, lower: 76 },
  { time: '10:30', actual: null, predicted: 76, upper: 85, lower: 67 },
  { time: '11:00', actual: null, predicted: 65, upper: 74, lower: 56 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C2333] border border-[#1E3A5F] rounded-lg p-3 text-xs">
      <p className="text-gray-400 mb-2 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value !== null && p.value !== undefined ? `${Math.round(p.value)}%` : '—'}
        </p>
      ))}
    </div>
  );
};

export function PredictionChart({ data }: { data?: any[] }) {
  const chartData = data && data.length > 0 ? data : DEFAULT_MOCK_DATA;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" name="Upper bound" />
        <Area type="monotone" dataKey="lower" stroke="none" fill="#0D1117" name="Lower bound" />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#EF4444"
          strokeWidth={2}
          fill="url(#actualGrad)"
          dot={{ fill: '#EF4444', r: 3 }}
          name="Actual"
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="predicted"
          stroke="#38BDF8"
          strokeWidth={2}
          strokeDasharray="5 3"
          fill="none"
          dot={false}
          name="Predicted"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
