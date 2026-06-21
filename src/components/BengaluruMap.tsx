import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

const LEVEL_COLOR: Record<string, string> = {
  LOW: '#22C55E',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
};

const PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'hebbal': { x: 37, y: 15 },
  'kr-puram': { x: 72, y: 28 },
  'marathahalli': { x: 78, y: 50 },
  'silk-board': { x: 55, y: 72 },
  'electronic-city': { x: 50, y: 88 },
};

export function BengaluruMap({ showHeatmap }: { showHeatmap: boolean }) {
  const { junctions, selectJunction } = useAppStore();
  const navigate = useNavigate();

  const handleJunctionClick = (id: string) => {
    selectJunction(id);
    navigate(`/junction/${id}`);
  };

  return (
    <div className="relative w-full h-full bg-[#0D1117] rounded-xl overflow-hidden border border-[#1E3A5F]">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1E3A5F" strokeWidth="0.15" opacity="0.5" />
          </pattern>
          {showHeatmap && (
            <radialGradient id="heatSB" cx="55%" cy="72%" r="15%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>
          )}
          {showHeatmap && (
            <radialGradient id="heatMH" cx="78%" cy="50%" r="12%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </radialGradient>
          )}
          {showHeatmap && (
            <radialGradient id="heatKR" cx="72%" cy="28%" r="10%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>

        <rect width="100" height="100" fill="url(#grid)" />

        {/* City outline — simplified Bengaluru shape */}
        <path
          d="M25,10 Q35,5 50,8 Q65,5 75,12 Q88,20 90,35 Q95,50 88,65 Q82,78 70,85 Q58,92 45,90 Q30,88 20,78 Q10,65 12,48 Q12,30 25,10 Z"
          fill="#131920"
          stroke="#1E3A5F"
          strokeWidth="0.5"
        />

        {/* Road network */}
        {/* NH44 / Bellary Road */}
        <path d="M37,0 L37,15 L45,35 L52,55 L55,72" stroke="#1E3A5F" strokeWidth="0.8" fill="none" opacity="0.6" />
        {/* ORR */}
        <ellipse cx="57" cy="52" rx="30" ry="28" fill="none" stroke="#1E3A5F" strokeWidth="0.7" opacity="0.5" />
        {/* Hosur Road */}
        <path d="M55,72 L52,82 L50,92" stroke="#1E3A5F" strokeWidth="0.8" fill="none" opacity="0.6" />
        {/* Old Madras Road */}
        <path d="M20,28 L42,30 L60,28 L80,22" stroke="#1E3A5F" strokeWidth="0.7" fill="none" opacity="0.5" />
        {/* Whitefield Road */}
        <path d="M72,28 L82,40 L83,55" stroke="#1E3A5F" strokeWidth="0.6" fill="none" opacity="0.4" />
        {/* Other roads */}
        <path d="M15,50 L35,52 L55,52 L75,52" stroke="#1E3A5F" strokeWidth="0.6" fill="none" opacity="0.4" />
        <path d="M30,70 L50,68 L68,72 L80,78" stroke="#1E3A5F" strokeWidth="0.5" fill="none" opacity="0.4" />

        {/* Heatmap overlays */}
        {showHeatmap && <rect x="0" y="0" width="100" height="100" fill="url(#heatSB)" />}
        {showHeatmap && <rect x="0" y="0" width="100" height="100" fill="url(#heatMH)" />}
        {showHeatmap && <rect x="0" y="0" width="100" height="100" fill="url(#heatKR)" />}

        {/* Junction markers */}
        {junctions.map((j) => {
          const pos = PIN_POSITIONS[j.id];
          if (!pos) return null;
          const color = LEVEL_COLOR[j.level];
          return (
            <g
              key={j.id}
              transform={`translate(${pos.x},${pos.y})`}
              onClick={() => handleJunctionClick(j.id)}
              style={{ cursor: 'pointer' }}
            >
              {j.level === 'CRITICAL' && (
                <circle r="4" fill={color} opacity="0.2">
                  <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r="2.5" fill={color} stroke="#0D1117" strokeWidth="0.5" />
              <circle r="1" fill="white" opacity="0.9" />

              {/* Label */}
              <text
                x="3.5"
                y="-3"
                fontSize="2.8"
                fill="white"
                opacity="0.85"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
              >
                {j.name.replace(' Junction', '').replace(' Bridge', '')}
              </text>
              <text
                x="3.5"
                y="0"
                fontSize="2.2"
                fill={color}
                opacity="0.9"
                fontFamily="Inter, sans-serif"
              >
                {j.density}% · {j.level}
              </text>
            </g>
          );
        })}

        {/* Compass */}
        <text x="90" y="8" fontSize="3.5" fill="#38BDF8" opacity="0.6" fontFamily="Inter, sans-serif" textAnchor="middle">N</text>
        <path d="M90,9.5 L90,13" stroke="#38BDF8" strokeWidth="0.4" opacity="0.4" />

        {/* Legend */}
        <g transform="translate(2,88)">
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl, i) => (
            <g key={lvl} transform={`translate(${i * 22},0)`}>
              <circle cx="2" cy="2" r="1.5" fill={LEVEL_COLOR[lvl]} />
              <text x="5" y="4.5" fontSize="2" fill="#9CA3AF" fontFamily="Inter, sans-serif">{lvl}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
