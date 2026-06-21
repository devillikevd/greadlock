interface Props {
  value: number;
  size?: number;
}

export function DensityGauge({ value, size = 120 }: Props) {
  const radius = (size / 2) * 0.8;
  const circumference = 2 * Math.PI * radius;
  const stroke = circumference - (value / 100) * circumference;
  const color =
    value < 50 ? '#22C55E' : value < 75 ? '#F59E0B' : value < 90 ? '#F97316' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1E3A5F"
          strokeWidth={size * 0.1}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.1}
          strokeDasharray={circumference}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold leading-none" style={{ fontSize: size * 0.22, color }}>
          {value}%
        </div>
        <div className="text-gray-400 mt-0.5" style={{ fontSize: size * 0.09 }}>
          Density
        </div>
      </div>
    </div>
  );
}
