import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getLogs } from '../api/client';
import type { LogEntry } from '../types';

const LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 } as const;
const LEVEL_COLOR: Record<string, string> = {
  TRACE: 'text-slate-600', DEBUG: 'text-slate-500',
  INFO: 'text-cyan-400',  WARN: 'text-yellow-400', ERROR: 'text-red-400 font-bold',
};

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await getLogs(200);
      setLogs(data);
      setTimeout(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, 50);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (!auto) return; const id = setInterval(load, 5000); return () => clearInterval(id); }, [auto]);

  const min = filter ? (LEVELS as any)[filter] : -1;
  const filtered = logs.filter(l => !filter || ((LEVELS as any)[l.level] ?? 0) >= min);

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
        <h2 className="font-semibold">Logs <span className="text-xs text-muted">(últimas 200 linhas)</span></h2>
        <div className="flex items-center gap-2">
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} /> auto 5s</label>
          <select className="input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Todos os níveis</option>
            <option value="ERROR">Apenas ERROR</option>
            <option value="WARN">WARN+</option>
            <option value="INFO">INFO+</option>
          </select>
          <button className="btn-outline" onClick={load}><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>
      <div ref={ref} className="bg-black/60 border-t border-border max-h-[600px] overflow-auto p-3 font-mono text-xs">
        {filtered.length === 0 ? <div className="text-center text-muted py-8">Nenhum log para exibir.</div>
          : filtered.map((l, i) => (
            <div key={i} className="py-0.5 whitespace-pre-wrap break-words border-b border-slate-800 last:border-b-0">
              <span className="text-slate-600 mr-2">{l.time}</span>
              <span className={(LEVEL_COLOR[l.level] || 'text-slate-400') + ' mr-2'}>[{l.level.padEnd(5)}]</span>
              <span className="text-muted mr-2">{l.logger}</span>
              {l.message}
            </div>
          ))
        }
      </div>
    </div>
  );
}
