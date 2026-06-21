import { AlertTriangle, Zap, Info, CheckCircle, X } from 'lucide-react';
import { type Alert } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';

interface Props {
  alert: Alert;
}

const CONFIG = {
  P0: { label: 'P0 CRITICAL', border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle, iconColor: 'text-red-500' },
  P1: { label: 'P1 HIGH', border: 'border-orange-500/50', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: Zap, iconColor: 'text-orange-500' },
  P2: { label: 'P2 MEDIUM', border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Info, iconColor: 'text-amber-500' },
  P3: { label: 'P3 LOW', border: 'border-sky-500/50', bg: 'bg-sky-500/10', text: 'text-sky-400', icon: CheckCircle, iconColor: 'text-sky-500' },
};

export function AlertCard({ alert }: Props) {
  const { dismissAlert, deployAlert } = useAppStore();
  const cfg = CONFIG[alert.priority];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3.5 transition-all duration-200 hover:scale-[1.01]`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={cfg.iconColor} />
          <span className={`text-xs font-bold ${cfg.text} tracking-wider`}>{cfg.label}</span>
        </div>
        <span className="text-xs text-gray-500">{alert.timestamp}</span>
      </div>
      <p className="text-xs font-medium text-sky-300 mb-1">{alert.junction}</p>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">{alert.description}</p>
      <div className="flex gap-2">
        <button
          onClick={() => deployAlert(alert.id)}
          className="flex-1 py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-semibold border border-sky-500/30 transition-all duration-200"
        >
          Deploy
        </button>
        <button
          onClick={() => dismissAlert(alert.id)}
          className="py-1.5 px-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-500 hover:text-gray-400 transition-all duration-200"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
