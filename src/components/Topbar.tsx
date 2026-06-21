import { useState, useEffect } from 'react';
import { Bell, Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { LiveBadge } from './LiveBadge';

export function Topbar() {
  const { userName, userRole, logout, toggleSidebar, alerts } = useAppStore();
  const navigate = useNavigate();
  const [time, setTime] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const activeAlerts = alerts.filter((a) => !a.dismissed).length;

  const roleLabel: Record<string, string> = {
    constable: 'HC',
    inspector: 'Inspector',
    acp: 'ACP',
    commissioner: 'Commissioner',
    public: 'Public',
  };

  return (
    <header className="h-14 bg-[#161B22] border-b border-[#1E3A5F] flex items-center px-4 gap-4 shrink-0">
      <button onClick={toggleSidebar} className="text-gray-400 hover:text-white transition-colors lg:hidden">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white hidden sm:block">Bengaluru Traffic Command</span>
        <LiveBadge />
      </div>

      <div className="flex-1" />

      <div className="text-xs font-mono text-gray-400 hidden sm:block">{time}</div>

      <div className="relative">
        <button className="relative p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
          {activeAlerts > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {activeAlerts}
            </span>
          )}
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <span className="text-sky-400 text-xs font-bold">{userName.charAt(0)}</span>
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{userName}</div>
            <div className="text-[10px] text-gray-500">{roleLabel[userRole]}</div>
          </div>
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-[#1C2333] border border-[#1E3A5F] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#1E3A5F]">
              <div className="text-xs font-semibold text-white">{userName}</div>
              <div className="text-xs text-gray-500 capitalize">{userRole}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
