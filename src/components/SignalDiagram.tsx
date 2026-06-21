interface Props {
  mode: 'fixed' | 'ai';
}

export function SignalDiagram({ mode }: Props) {
  const greenDuration = mode === 'ai' ? '3s' : '6s';
  const redDuration = mode === 'ai' ? '3s' : '6s';

  return (
    <div className="flex items-center justify-center gap-8">
      {['N', 'S', 'E', 'W'].map((dir) => {
        const offset = dir === 'N' ? '0s' : dir === 'S' ? '1.5s' : dir === 'E' ? '0.75s' : '2.25s';
        if (mode === 'ai') {
          const aiOffset = dir === 'N' ? '0s' : dir === 'S' ? '2s' : dir === 'E' ? '1s' : '3s';
          return (
            <div key={dir} className="flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">{dir}</span>
              <div className="bg-[#0D1117] border border-[#1E3A5F] rounded-lg p-2 flex flex-col gap-1.5 w-9">
                <div
                  className="w-5 h-5 rounded-full mx-auto"
                  style={{
                    background: '#EF4444',
                    animation: `pulse-ai-red-${dir} ${greenDuration} ${aiOffset} infinite`,
                    boxShadow: `0 0 8px rgba(239,68,68,0.6)`,
                  }}
                />
                <div
                  className="w-5 h-5 rounded-full mx-auto bg-amber-500/20"
                />
                <div
                  className="w-5 h-5 rounded-full mx-auto"
                  style={{
                    background: '#22C55E',
                    animation: `pulse-ai-green-${dir} ${greenDuration} ${aiOffset} infinite`,
                    boxShadow: `0 0 8px rgba(34,197,94,0.6)`,
                    opacity: 0.2,
                  }}
                />
              </div>
            </div>
          );
        }
        return (
          <div key={dir} className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">{dir}</span>
            <div className="bg-[#0D1117] border border-[#1E3A5F] rounded-lg p-2 flex flex-col gap-1.5 w-9">
              <AnimatedLight color="#EF4444" phase="red" duration={redDuration} offset={offset} />
              <div className="w-5 h-5 rounded-full mx-auto bg-amber-500/20" />
              <AnimatedLight color="#22C55E" phase="green" duration={greenDuration} offset={offset} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnimatedLight({ color, phase, duration, offset }: { color: string; phase: string; duration: string; offset: string }) {
  const isGreen = phase === 'green';
  return (
    <div
      className="w-5 h-5 rounded-full mx-auto transition-all"
      style={{
        background: color,
        opacity: isGreen ? 0.15 : 0.9,
        boxShadow: isGreen ? 'none' : `0 0 8px ${color}99`,
        animation: `signal-blink-${phase} ${duration} ${offset} infinite`,
      }}
    />
  );
}
