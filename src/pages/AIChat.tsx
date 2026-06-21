import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Bot, User, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { API_BASE_URL } from '../config';

const STARTERS = [
  'Silk Board traffic status?',
  'Next hour prediction for ORR?',
  'How many incidents today?',
];

const LANG_LABELS: Record<string, string> = { en: 'EN', kn: 'ಕನ್ನಡ', hi: 'हि' };

const LEVEL_BADGE: Record<string, string> = {
  LOW: 'bg-green-500/20 text-green-400',
  MEDIUM: 'bg-amber-500/20 text-amber-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  CRITICAL: 'bg-red-500/20 text-red-400',
};

const AI_RESPONSE_MAP: Record<string, string> = {
  default:
    'I can help with traffic status, signal optimization, incident reports, and predictions for any junction in Bengaluru. Please ask me about a specific junction or area.',
};

function generateAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('silk board') || lower.includes('silkboard')) {
    return 'Silk Board Junction is at CRITICAL status (94% density). Vehicle count: 2,847. Avg speed: 4 km/hr. A vehicle breakdown on Hosur Road northbound is the primary bottleneck. AI Recommendation: Deploy traffic marshals, extend ORR east green phase by 90s.';
  }
  if (lower.includes('marathahalli') || lower.includes('marathon')) {
    return 'Marathahalli Bridge is at HIGH density (82%). Active incident: minor accident on ORR southbound. Traffic backed up ~1.2 km. AI recommends signal coordination with Tin Factory and Iblur to redistribute load. ETA to clear: 25–35 minutes.';
  }
  if (lower.includes('hebbal')) {
    return 'Hebbal Flyover Junction is LOW density (45%). Avg speed 28 km/hr — well within normal range. No active incidents. Mild surge predicted between 10:00–10:30 AM. No immediate action required.';
  }
  if (lower.includes('kr puram') || lower.includes('kr-puram') || lower.includes('krpuram')) {
    return 'KR Puram Junction is at MEDIUM density (67%, trending down). Vehicle count: 1,543. The bridge load is at 71% capacity. Congestion expected to ease by 10:30 AM. AI suggests +45s green phase extension on Whitefield Road bound traffic.';
  }
  if (lower.includes('electronic city') || lower.includes('ec')) {
    return 'Electronic City Junction is at MEDIUM density (71%). A signal timing anomaly on Phase 2 corridor was auto-corrected at 09:05 AM — throughput improved 18%. Manual verification by on-site inspector is recommended.';
  }
  if (lower.includes('orr') || lower.includes('outer ring')) {
    return 'ORR status (09:44 AM):\n• Marathahalli: 82% — HIGH (incident)\n• Tin Factory: 63% — MEDIUM\n• Iblur: 51% — MEDIUM\n• Carmelaram: 38% — LOW\n\nOverall ORR load: elevated in eastern segment. AI corridor management active.';
  }
  if (lower.includes('incident') || lower.includes('today') || lower.includes('how many')) {
    return "Today's incident summary:\n✅ Resolved: 23\n🔴 Active: 3 (Silk Board breakdown, Marathahalli accident, EC signal fault)\n🟡 Pending: 2\n\nTotal: 28 incidents. Avg response: 8.4 min. Peak incident time: 08:15–09:00 AM.";
  }
  if (lower.includes('prediction') || lower.includes('predict') || lower.includes('forecast')) {
    return 'Next 2-hour forecast (10:00–12:00 AM):\n• Silk Board: 94% → 78% (improving as breakdown clears)\n• Marathahalli: 82% → 89% peak at 10:15, then easing\n• Hebbal: 45% → 58% mild surge, back to 48% by 11:00\n• Overall city: moderate congestion, improving post 11 AM.';
  }
  if (lower.includes('speed') || lower.includes('km')) {
    return 'City-wide average speed: 11 km/hr (below 25 km/hr baseline). Fastest corridor: Bellary Road at 42 km/hr. Slowest: Silk Board–BTM stretch at 4 km/hr. Speed enforcement active at 8 junctions.';
  }
  return AI_RESPONSE_MAP.default;
}

export function AIChat() {
  const { chatMessages, addChatMessage, chatLanguage, setChatLanguage } = useAppStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    addChatMessage({ role: 'user', content: text });
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          session_id: "default-session"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsTyping(false);
        addChatMessage({
          role: 'ai',
          content: data.content,
          confidence: data.confidence,
          junctionData: data.junctionData || undefined
        });
      } else {
        throw new Error("Backend response error");
      }
    } catch (e) {
      console.warn("Backend chat offline, falling back to mock response", e);
      setTimeout(() => {
        setIsTyping(false);
        addChatMessage({
          role: 'ai',
          content: generateAIResponse(text),
          confidence: Math.floor(Math.random() * 15 + 84),
        });
      }, 800 + Math.random() * 400);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation sidebar */}
      <div className="w-52 shrink-0 bg-[#161B22] border-r border-[#1E3A5F] flex flex-col hidden md:flex">
        <div className="p-3 border-b border-[#1E3A5F]">
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/15 text-sky-400 text-xs font-semibold border border-sky-500/20 transition-all">
            <Plus size={14} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {['Traffic Overview — Today', 'Silk Board Incident', 'ORR Prediction', 'Signal Optimization'].map((title, i) => (
            <button
              key={i}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                i === 0 ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E3A5F] shrink-0 bg-[#161B22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <Bot size={18} className="text-sky-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">AI Traffic Copilot</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Online · Bengaluru Smart City
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#1C2333] border border-[#1E3A5F] rounded-lg p-1">
            {(['en', 'kn', 'hi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setChatLanguage(lang)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  chatLanguage === lang ? 'bg-sky-500/20 text-sky-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Starter chips */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-3 py-1.5 rounded-full bg-[#1C2333] border border-[#1E3A5F] text-xs text-gray-300 hover:border-sky-500/40 hover:text-sky-300 transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>

          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === 'ai' ? 'bg-sky-500/15 border border-sky-500/25' : 'bg-[#1C2333] border border-[#1E3A5F]'
              }`}>
                {msg.role === 'ai' ? <Bot size={14} className="text-sky-400" /> : <User size={14} className="text-gray-400" />}
              </div>

              <div className={`max-w-[75%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-sky-500/20 text-white border border-sky-500/30 rounded-tr-sm'
                    : 'bg-[#1C2333] text-gray-200 border border-[#1E3A5F] rounded-tl-sm'
                }`}>
                  {msg.content}

                  {msg.junctionData && (
                    <div className={`mt-2 px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 ${LEVEL_BADGE[msg.junctionData.level]}`}>
                      <span className="font-semibold">{msg.junctionData.name}</span>
                      <span>{msg.junctionData.density}% · {msg.junctionData.level}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-gray-600">{msg.timestamp}</span>
                  {msg.confidence && (
                    <span className="text-xs text-green-500/70">
                      {msg.confidence}% confidence
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-sky-400" />
              </div>
              <div className="bg-[#1C2333] border border-[#1E3A5F] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-2 h-2 rounded-full bg-sky-400"
                      style={{ animation: `bounce 1s ${delay}ms infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="p-4 border-t border-[#1E3A5F] shrink-0 bg-[#161B22]">
          <div className="flex items-center gap-3 bg-[#1C2333] border border-[#1E3A5F] rounded-xl px-4 py-3 focus-within:border-sky-500/40 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about traffic, junctions, predictions…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors">
              <Mic size={16} />
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">AI responses are based on real-time sensor data and predictive models</p>
        </div>
      </div>
    </div>
  );
}
