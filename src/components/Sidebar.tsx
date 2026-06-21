import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, MessageSquare, Activity, Siren, FileBarChart, Settings, ChevronLeft, ChevronRight, TrafficCone,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/junctions', icon: GitBranch, label: 'Junctions' },
  { to: '/ai-chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/simulator', icon: Activity, label: 'Signal Simulator' },
  { to: '/emergency', icon: Siren, label: 'Emergency Corridor' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, userRole } = useAppStore();

  if (userRole === 'public') return null;

  return (
    <aside
      className="relative flex flex-col h-full bg-[#161B22] border-r border-[#1E3A5F] transition-all duration-300 shrink-0"
      style={{ width: sidebarOpen ? 220 : 64 }}
    >
      <div className={`flex items-center gap-3 p-4 border-b border-[#1E3A5F] ${!sidebarOpen ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0">
          <TrafficCone size={16} className="text-sky-400" />
        </div>
        {sidebarOpen && (
          <div>
            <div className="text-xs font-bold text-white leading-tight">AI Traffic</div>
            <div className="text-xs font-bold text-sky-400 leading-tight">Copilot</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              } ${!sidebarOpen ? 'justify-center' : ''}`
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1C2333] border border-[#1E3A5F] flex items-center justify-center text-gray-400 hover:text-sky-400 hover:border-sky-500/50 transition-all duration-200 z-10"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  );
}
