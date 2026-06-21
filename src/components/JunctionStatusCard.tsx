import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { type Junction } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  junction: Junction;
}

const LEVEL_CONFIG = {
  LOW: { bg: 'bg-green-500/10', border: 'border-green-500/30', badge: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-500' },
  MEDIUM: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  HIGH: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: 'bg-orange-500' },
  CRITICAL: { bg: 'bg-red-500/10', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
};

const DENSITY_COLOR = {
  LOW: 'text-green-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

export function JunctionStatusCard({ junction }: Props) {
  const { selectJunction } = useAppStore();
  const navigate = useNavigate();
  const cfg = LEVEL_CONFIG[junction.level];
  const TrendIcon = junction.trend === 'up' ? TrendingUp : junction.trend === 'down' ? TrendingDown : Minus;
  const trendColor = junction.trend === 'up' ? 'text-red-400' : junction.trend === 'down' ? 'text-green-400' : 'text-gray-400';

  const handleClick = () => {
    selectJunction(junction.id);
    navigate(`/junction/${junction.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <h3 className="font-semibold text-sm text-white group-hover:text-sky-300 transition-colors">{junction.name}</h3>
          </div>
          <p className="text-xs text-gray-500">{junction.zone}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${cfg.badge}`}>
          {junction.level}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={`text-3xl font-black ${DENSITY_COLOR[junction.level]}`}>{junction.density}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Density</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{junction.vehicleCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500">vehicles</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1">
          <TrendIcon size={14} className={trendColor} />
          <span className={`text-xs ${trendColor}`}>
            {junction.trend === 'up' ? 'Increasing' : junction.trend === 'down' ? 'Decreasing' : 'Stable'}
          </span>
        </div>
        <span className="text-xs text-gray-600">Updated {junction.lastUpdated}</span>
      </div>
    </div>
  );
}
