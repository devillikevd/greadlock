import { Bell, Shield, Database, Wifi, Save } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

function Toggle({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-10 h-5 rounded-full transition-all duration-200 relative ${on ? 'bg-sky-500' : 'bg-gray-700'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

export function Settings() {
  const { userName, userRole } = useAppStore();
  const [notifications, setNotifications] = useState({ critical: true, high: true, medium: false, sms: true, email: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <div>
        <h1 className="text-xl font-black text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Command Center configuration</p>
      </div>

      {/* Profile */}
      <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={16} className="text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Officer Profile</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Your credentials and role assignment</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Name', value: userName },
            { label: 'Role', value: userRole.charAt(0).toUpperCase() + userRole.slice(1) },
            { label: 'Department', value: 'Bengaluru Traffic Police' },
            { label: 'Badge ID', value: 'BTP-2026-' + Math.floor(Math.random() * 9000 + 1000) },
            { label: 'Zone Assignment', value: 'South & East Bengaluru' },
            { label: 'Shift', value: 'Morning (06:00 – 14:00)' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input
                defaultValue={value}
                readOnly
                className="w-full bg-[#0D1117] border border-[#1E3A5F] rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none cursor-default"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <Bell size={16} className="text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Alert Notifications</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Choose which alerts trigger notifications</p>
        <div className="space-y-3">
          {[
            { key: 'critical', label: 'Critical (P0) Alerts', desc: 'Immediate notification for critical incidents' },
            { key: 'high', label: 'High (P1) Alerts', desc: 'High priority traffic events' },
            { key: 'medium', label: 'Medium (P2) Alerts', desc: 'Moderate congestion notifications' },
            { key: 'sms', label: 'SMS Notifications', desc: 'Receive alerts via SMS on duty phone' },
            { key: 'email', label: 'Email Digest', desc: 'Daily summary email at end of shift' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-[#1E3A5F] last:border-0">
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <Toggle
                on={notifications[key as keyof typeof notifications]}
                setOn={(v) => setNotifications((n) => ({ ...n, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Data & Connectivity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Wifi size={16} className="text-sky-400" />
            <h3 className="text-sm font-semibold text-white">System Status</h3>
          </div>
          {[
            { label: 'AI Engine', status: 'Online', color: 'text-green-400' },
            { label: 'Camera Network', status: '47/52 Active', color: 'text-green-400' },
            { label: 'Signal Controllers', status: '312/324 Online', color: 'text-amber-400' },
            { label: 'Data Pipeline', status: 'Healthy', color: 'text-green-400' },
            { label: 'Last Sync', status: 'Just now', color: 'text-gray-400' },
          ].map(({ label, status, color }) => (
            <div key={label} className="flex justify-between py-1.5 text-xs border-b border-[#1E3A5F] last:border-0">
              <span className="text-gray-400">{label}</span>
              <span className={`font-semibold ${color}`}>{status}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Database size={16} className="text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Data Settings</h3>
          </div>
          {[
            { label: 'Refresh Rate', value: '30 seconds' },
            { label: 'Data Retention', value: '90 days' },
            { label: 'AI Model Version', value: 'TrafficNet v4.2' },
            { label: 'Map Provider', value: 'BBMP GIS' },
            { label: 'API Version', value: 'v3.1.0' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1.5 text-xs border-b border-[#1E3A5F] last:border-0">
              <span className="text-gray-400">{label}</span>
              <span className="text-gray-300 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            saved ? 'bg-green-500 text-white' : 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20'
          }`}
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
