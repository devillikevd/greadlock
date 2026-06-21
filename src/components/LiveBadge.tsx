export function LiveBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-2.5 h-2.5">
        <div className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-75" />
        <div className="w-2 h-2 rounded-full bg-red-500" />
      </div>
      <span className="text-xs font-bold tracking-widest text-red-400 uppercase">Live</span>
    </div>
  );
}
