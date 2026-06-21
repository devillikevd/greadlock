import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrafficCone, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAppStore, type UserRole } from '../store/useAppStore';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'constable', label: 'Traffic Constable (HC)' },
  { value: 'inspector', label: 'Traffic Inspector (SI/PI)' },
  { value: 'acp', label: 'Assistant Commissioner (ACP)' },
  { value: 'commissioner', label: 'Commissioner of Police' },
  { value: 'public', label: 'Public User' },
];

export function Login() {
  const [email, setEmail] = useState('inspector@bbmp.gov.in');
  const [password, setPassword] = useState('Traffic@2026');
  const [role, setRole] = useState<UserRole>('inspector');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(role, email);
      navigate(role === 'public' ? '/public' : '/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center relative overflow-hidden">
      {/* City skyline SVG */}
      <div className="absolute bottom-0 left-0 right-0 opacity-20">
        <svg viewBox="0 0 1440 200" className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="skyline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0D1117" />
            </linearGradient>
          </defs>
          {/* Buildings */}
          <rect x="0" y="80" width="60" height="120" fill="url(#skyline)" />
          <rect x="40" y="50" width="40" height="150" fill="url(#skyline)" />
          <rect x="90" y="70" width="50" height="130" fill="url(#skyline)" />
          <rect x="150" y="30" width="35" height="170" fill="url(#skyline)" />
          <rect x="195" y="60" width="55" height="140" fill="url(#skyline)" />
          <rect x="260" y="40" width="45" height="160" fill="url(#skyline)" />
          <rect x="310" y="90" width="40" height="110" fill="url(#skyline)" />
          <rect x="360" y="55" width="60" height="145" fill="url(#skyline)" />
          <rect x="430" y="35" width="50" height="165" fill="url(#skyline)" />
          <rect x="490" y="65" width="40" height="135" fill="url(#skyline)" />
          <rect x="540" y="45" width="55" height="155" fill="url(#skyline)" />
          <rect x="605" y="20" width="45" height="180" fill="url(#skyline)" />
          <rect x="660" y="55" width="50" height="145" fill="url(#skyline)" />
          <rect x="720" y="70" width="40" height="130" fill="url(#skyline)" />
          <rect x="770" y="40" width="55" height="160" fill="url(#skyline)" />
          <rect x="835" y="60" width="45" height="140" fill="url(#skyline)" />
          <rect x="890" y="30" width="50" height="170" fill="url(#skyline)" />
          <rect x="950" y="55" width="40" height="145" fill="url(#skyline)" />
          <rect x="1000" y="75" width="55" height="125" fill="url(#skyline)" />
          <rect x="1065" y="45" width="45" height="155" fill="url(#skyline)" />
          <rect x="1120" y="35" width="50" height="165" fill="url(#skyline)" />
          <rect x="1180" y="60" width="40" height="140" fill="url(#skyline)" />
          <rect x="1230" y="50" width="55" height="150" fill="url(#skyline)" />
          <rect x="1295" y="70" width="45" height="130" fill="url(#skyline)" />
          <rect x="1350" y="40" width="50" height="160" fill="url(#skyline)" />
          <rect x="1400" y="55" width="40" height="145" fill="url(#skyline)" />
          {/* Windows */}
          {[200, 270, 370, 450, 555, 615, 670, 780, 900, 1070, 1135, 1240, 1305].map((x) => (
            <g key={x}>
              <rect x={x + 8} y="80" width="8" height="10" fill="#38BDF8" opacity="0.6" />
              <rect x={x + 22} y="80" width="8" height="10" fill="#38BDF8" opacity="0.4" />
              <rect x={x + 8} y="100" width="8" height="10" fill="#38BDF8" opacity="0.3" />
            </g>
          ))}
        </svg>
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 mb-4 shadow-lg shadow-sky-500/10">
            <TrafficCone size={32} className="text-sky-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Traffic Copilot</h1>
          <p className="text-sm text-gray-400 mt-1">Bengaluru Smart City Traffic Intelligence Platform</p>
        </div>

        {/* Login card */}
        <div className="bg-[#161B22] border border-[#1E3A5F] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Sign in to Command Center</h2>
          <p className="text-sm text-gray-500 mb-6">Authorised personnel only — BBMP / BTP</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5 uppercase tracking-wider">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#1C2333] border border-[#1E3A5F] rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/60 transition-colors"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1C2333] border border-[#1E3A5F] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/60 transition-colors"
                placeholder="officer@bbmp.gov.in"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1C2333] border border-[#1E3A5F] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/60 transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-70 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Command Center'
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#1E3A5F] text-center">
            <p className="text-xs text-gray-600">
              Bengaluru Traffic Police · BBMP Smart City Division
            </p>
            <p className="text-xs text-gray-700 mt-0.5">v3.1.0 · Secured by BTP Auth</p>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => { login('public', ''); navigate('/public'); }}
            className="text-xs text-gray-500 hover:text-sky-400 transition-colors"
          >
            Continue as Public User (read-only) →
          </button>
        </div>
      </div>
    </div>
  );
}
