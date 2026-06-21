import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config';

export type UserRole = 'constable' | 'inspector' | 'acp' | 'commissioner' | 'public';

export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Junction {
  id: string;
  name: string;
  zone: string;
  density: number;
  vehicleCount: number;
  level: DensityLevel;
  avgSpeed: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  lat: number;
  lng: number;
  lanes: { name: string; count: number }[];
  incidents: Incident[];
}

export interface Incident {
  id: string;
  timestamp: string;
  type: string;
  status: 'Resolved' | 'Active' | 'Pending';
  officer: string;
}

export interface Alert {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  junction: string;
  description: string;
  timestamp: string;
  dismissed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  confidence?: number;
  junctionData?: { name: string; density: number; level: DensityLevel };
}

interface AppStore {
  isLoggedIn: boolean;
  userRole: UserRole;
  userName: string;
  sidebarOpen: boolean;
  selectedJunctionId: string | null;
  alerts: Alert[];
  junctions: Junction[];
  chatMessages: ChatMessage[];
  chatLanguage: 'en' | 'kn' | 'hi';
  login: (role: UserRole, email: string) => void;
  logout: () => void;
  toggleSidebar: () => void;
  selectJunction: (id: string | null) => void;
  dismissAlert: (id: string) => Promise<void>;
  deployAlert: (id: string) => Promise<void>;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatLanguage: (lang: 'en' | 'kn' | 'hi') => void;
  fetchData: () => Promise<void>;
}

const JUNCTIONS: Junction[] = [
  {
    id: 'silk-board',
    name: 'Silk Board Junction',
    zone: 'South Bengaluru',
    density: 94,
    vehicleCount: 2847,
    level: 'CRITICAL',
    avgSpeed: 4,
    trend: 'up',
    lastUpdated: '2 min ago',
    lat: 12.9175,
    lng: 77.6229,
    lanes: [
      { name: 'Hosur Road (N)', count: 824 },
      { name: 'Hosur Road (S)', count: 712 },
      { name: 'ORR East', count: 698 },
      { name: 'ORR West', count: 613 },
    ],
    incidents: [
      { id: 'i1', timestamp: '09:42 AM', type: 'Vehicle Breakdown', status: 'Active', officer: 'HC Ravi Kumar' },
      { id: 'i2', timestamp: '08:15 AM', type: 'Signal Fault', status: 'Resolved', officer: 'SI Pradeep' },
      { id: 'i3', timestamp: '07:50 AM', type: 'Congestion Peak', status: 'Resolved', officer: 'HC Suresh' },
    ],
  },
  {
    id: 'kr-puram',
    name: 'KR Puram Junction',
    zone: 'East Bengaluru',
    density: 67,
    vehicleCount: 1543,
    level: 'MEDIUM',
    avgSpeed: 14,
    trend: 'down',
    lastUpdated: '1 min ago',
    lat: 13.0052,
    lng: 77.6961,
    lanes: [
      { name: 'Old Madras Road (W)', count: 412 },
      { name: 'Old Madras Road (E)', count: 389 },
      { name: 'KR Puram Bridge', count: 487 },
      { name: 'Whitefield Road', count: 255 },
    ],
    incidents: [
      { id: 'i4', timestamp: '09:10 AM', type: 'Unauthorized Parking', status: 'Pending', officer: 'HC Manjunath' },
    ],
  },
  {
    id: 'hebbal',
    name: 'Hebbal Flyover Junction',
    zone: 'North Bengaluru',
    density: 45,
    vehicleCount: 892,
    level: 'LOW',
    avgSpeed: 28,
    trend: 'stable',
    lastUpdated: '3 min ago',
    lat: 13.0358,
    lng: 77.5970,
    lanes: [
      { name: 'NH44 North', count: 245 },
      { name: 'NH44 South', count: 231 },
      { name: 'Bellary Road', count: 298 },
      { name: 'Hebbal Lake Road', count: 118 },
    ],
    incidents: [],
  },
  {
    id: 'marathahalli',
    name: 'Marathahalli Bridge',
    zone: 'East Bengaluru',
    density: 82,
    vehicleCount: 2103,
    level: 'HIGH',
    avgSpeed: 8,
    trend: 'up',
    lastUpdated: '1 min ago',
    lat: 12.9592,
    lng: 77.6974,
    lanes: [
      { name: 'Outer Ring Road (N)', count: 567 },
      { name: 'Outer Ring Road (S)', count: 612 },
      { name: 'Marathahalli Bridge', count: 498 },
      { name: 'ITPL Main Road', count: 426 },
    ],
    incidents: [
      { id: 'i5', timestamp: '09:32 AM', type: 'Minor Accident', status: 'Active', officer: 'SI Venkatesh' },
      { id: 'i6', timestamp: '08:45 AM', type: 'Waterlogging', status: 'Resolved', officer: 'HC Ramesh' },
    ],
  },
  {
    id: 'electronic-city',
    name: 'Electronic City Junction',
    zone: 'South Bengaluru',
    density: 71,
    vehicleCount: 1687,
    level: 'MEDIUM',
    avgSpeed: 12,
    trend: 'down',
    lastUpdated: '2 min ago',
    lat: 12.8456,
    lng: 77.6603,
    lanes: [
      { name: 'Hosur Road Phase 1', count: 489 },
      { name: 'Hosur Road Phase 2', count: 412 },
      { name: 'EC Access Road', count: 387 },
      { name: 'NICE Road Entry', count: 399 },
    ],
    incidents: [
      { id: 'i7', timestamp: '09:05 AM', type: 'Signal Timing Issue', status: 'Pending', officer: 'HC Deepak' },
    ],
  },
];

const ALERTS: Alert[] = [
  {
    id: 'a1',
    priority: 'P0',
    junction: 'Silk Board Junction',
    description: 'Critical congestion — 94% density. Vehicle breakdown blocking Hosur Road northbound. Deploy emergency response immediately.',
    timestamp: '09:44 AM',
    dismissed: false,
  },
  {
    id: 'a2',
    priority: 'P1',
    junction: 'Marathahalli Bridge',
    description: 'High density 82%. Minor accident on ORR southbound — traffic backing up 1.2 km. Recommend signal phase extension.',
    timestamp: '09:38 AM',
    dismissed: false,
  },
  {
    id: 'a3',
    priority: 'P2',
    junction: 'KR Puram Junction',
    description: 'Moderate congestion 67%. Peak hour surge expected. AI recommends extending green phase by 45s on Whitefield Road.',
    timestamp: '09:31 AM',
    dismissed: false,
  },
  {
    id: 'a4',
    priority: 'P2',
    junction: 'Electronic City Junction',
    description: 'Signal timing mismatch detected on Phase 2 corridor. Automated correction applied — monitoring in progress.',
    timestamp: '09:22 AM',
    dismissed: false,
  },
  {
    id: 'a5',
    priority: 'P3',
    junction: 'Hebbal Flyover Junction',
    description: 'Light congestion detected. Predicted to ease in 20 minutes. No immediate action required.',
    timestamp: '09:15 AM',
    dismissed: false,
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'c0',
    role: 'ai',
    content: 'Namaskara! I am AI Traffic Copilot for Bengaluru Smart City. I can provide real-time junction status, traffic predictions, incident reports, and signal recommendations. How can I assist you today?',
    timestamp: '09:40 AM',
    confidence: 98,
  },
  {
    id: 'c1',
    role: 'user',
    content: 'Silk Board traffic status?',
    timestamp: '09:41 AM',
  },
  {
    id: 'c2',
    role: 'ai',
    content: 'Silk Board Junction is currently at CRITICAL status (94% density). Live vehicle count: 2,847 vehicles. Average speed has dropped to 4 km/hr — well below the 25 km/hr baseline. A vehicle breakdown on Hosur Road northbound is the primary cause. Emergency response has been notified. Estimated clearance time: 35–45 minutes.',
    timestamp: '09:41 AM',
    confidence: 92,
    junctionData: { name: 'Silk Board Junction', density: 94, level: 'CRITICAL' },
  },
  {
    id: 'c3',
    role: 'user',
    content: 'Next hour prediction for ORR?',
    timestamp: '09:42 AM',
  },
  {
    id: 'c4',
    role: 'ai',
    content: 'ORR (Outer Ring Road) prediction for 10:00–11:00 AM:\n\n• Marathahalli Bridge: Density expected to rise from 82% → 89% by 10:15 AM (school run + IT shift overlap). Recommend pre-emptive signal phase change.\n• Tin Factory Junction: Currently moderate (63%). Expected to peak at 78% around 10:30 AM.\n• Iblur Junction: Stable at 51% — no intervention needed.\n\nOverall ORR flow will improve after 11:00 AM as IT peak disperses.',
    timestamp: '09:42 AM',
    confidence: 87,
  },
  {
    id: 'c5',
    role: 'user',
    content: 'How many incidents today?',
    timestamp: '09:43 AM',
  },
  {
    id: 'c6',
    role: 'ai',
    content: "Today's incident summary (as of 09:43 AM):\n\n🟢 Resolved: 23 incidents\n🔴 Active: 3 incidents (Silk Board breakdown, Marathahalli accident, EC signal fault)\n🟡 Pending: 2 incidents\n\nTotal: 28 incidents logged. Response time avg: 8.4 minutes. Fastest response: 3.1 min (Hebbal). Most common type: Signal Fault (9 incidents).",
    timestamp: '09:43 AM',
    confidence: 99,
  },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
  isLoggedIn: false,
  userRole: 'inspector',
  userName: 'Inspector Suresh Kumar',
  sidebarOpen: true,
  selectedJunctionId: null,
  alerts: ALERTS,
  junctions: JUNCTIONS,
  chatMessages: INITIAL_CHAT,
  chatLanguage: 'en',

  login: (role, _email) => {
    const nameMap: Record<UserRole, string> = {
      constable: 'HC Ravi Kumar',
      inspector: 'Inspector Suresh Kumar',
      acp: 'ACP Meera Sharma',
      commissioner: 'Commissioner Rajiv Nair',
      public: 'Public User',
    };
    set({ isLoggedIn: true, userRole: role, userName: nameMap[role] });
  },

  logout: () => set({ isLoggedIn: false }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  selectJunction: (id) => set({ selectedJunctionId: id }),

  dismissAlert: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/recommendations/${id}/dismiss`, { method: "POST" });
    } catch (e) {
      console.warn("Backend offline, dismissing alert locally", e);
    }
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    }));
  },

  deployAlert: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/recommendations/${id}/deploy`, { method: "POST" });
    } catch (e) {
      console.warn("Backend offline, deploying alert locally", e);
    }
    set((s) => ({
      alerts: s.alerts.filter((a) => a.id !== id),
    }));
  },

  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages,
        { ...msg, id: `c${Date.now()}`, timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
      ],
    })),

  setChatLanguage: (lang) => set({ chatLanguage: lang }),
  fetchData: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/junctions`);
      if (res.ok) {
        const data = await res.json();
        const junctions = data.map((j: any) => {
          const laneNames = {
            "silk-board": ["Hosur Road (N)", "Hosur Road (S)", "ORR East", "ORR West"],
            "kr-puram": ["Old Madras Road (W)", "Old Madras Road (E)", "KR Puram Bridge", "Whitefield Road"],
            "hebbal": ["NH44 North", "NH44 South", "Bellary Road", "Hebbal Lake Road"],
            "marathahalli": ["Outer Ring Road (N)", "Outer Ring Road (S)", "Marathahalli Bridge", "ITPL Main Road"],
            "electronic-city": ["Hosur Road Phase 1", "Hosur Road Phase 2", "EC Access Road", "NICE Road Entry"]
          }[j.id] || ["Lane A", "Lane B", "Lane C", "Lane D"];
          
          const total = j.vehicleCount;
          const l_cnts = [Math.round(total * 0.35), Math.round(total * 0.25), Math.round(total * 0.22), 0];
          l_cnts[3] = total - (l_cnts[0] + l_cnts[1] + l_cnts[2]);
          
          return {
            id: j.id,
            name: j.name,
            zone: j.zone,
            density: j.density,
            vehicleCount: j.vehicleCount,
            level: j.level as DensityLevel,
            avgSpeed: j.avgSpeed,
            trend: j.trend as 'up' | 'down' | 'stable',
            lastUpdated: j.lastUpdated,
            lat: j.lat,
            lng: j.lng,
            lanes: laneNames.map((name, i) => ({ name, count: Math.max(0, l_cnts[i]) })),
            incidents: []
          };
        });
        set({ junctions });
      }
      
      const aRes = await fetch(`${API_BASE_URL}/recommendations?status=pending`);
      if (aRes.ok) {
        const recs = await aRes.json();
        const alerts = recs.map((r: any) => ({
          id: r.id.toString(),
          priority: r.priority,
          junction: r.junction_id,
          description: r.action_detail,
          timestamp: new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          dismissed: false
        }));
        if (alerts.length > 0) {
          set({ alerts });
        }
      }
    } catch (e) {
      console.warn("Backend offline, using mock data", e);
    }
  },
    }),
    {
      name: 'ai-traffic-copilot',
      partialize: (s) => ({ isLoggedIn: s.isLoggedIn, userRole: s.userRole, userName: s.userName }),
    }
  )
);
