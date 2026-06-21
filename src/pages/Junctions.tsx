import { useAppStore } from '../store/useAppStore';
import { JunctionStatusCard } from '../components/JunctionStatusCard';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function Junctions() {
  const { junctions } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const filtered = junctions.filter((j) => {
    const matchSearch = j.name.toLowerCase().includes(search.toLowerCase()) || j.zone.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'ALL' || j.level === filterLevel;
    return matchSearch && matchLevel;
  });

  const counts = {
    ALL: junctions.length,
    CRITICAL: junctions.filter((j) => j.level === 'CRITICAL').length,
    HIGH: junctions.filter((j) => j.level === 'HIGH').length,
    MEDIUM: junctions.filter((j) => j.level === 'MEDIUM').length,
    LOW: junctions.filter((j) => j.level === 'LOW').length,
  };

  const FILTER_STYLES: Record<string, string> = {
    ALL: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <div>
        <h1 className="text-xl font-black text-white">Junction Monitor</h1>
        <p className="text-sm text-gray-400 mt-0.5">All {junctions.length} monitored junctions across Bengaluru</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search junction or zone…"
            className="w-full bg-[#1C2333] border border-[#1E3A5F] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                filterLevel === lvl ? FILTER_STYLES[lvl] : 'bg-[#1C2333] border-[#1E3A5F] text-gray-400 hover:text-gray-200'
              }`}
            >
              {lvl} ({counts[lvl]})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((j) => <JunctionStatusCard key={j.id} junction={j} />)}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-500">
            No junctions match your search or filter.
          </div>
        )}
      </div>
    </div>
  );
}
