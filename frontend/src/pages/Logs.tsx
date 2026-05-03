import { useEffect, useRef, useState } from "react";
import { RefreshCw, Terminal } from "lucide-react";
import { getLogs } from "@/api/client";
import type { LogEntry } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";

const LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 } as const;
const LEVEL_COLOR: Record<string, string> = {
  TRACE: "text-muted-foreground/70",
  DEBUG: "text-muted-foreground",
  INFO: "text-accent",
  WARN: "text-warning",
  ERROR: "text-destructive font-bold",
};

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await getLogs(200);
      setLogs(data);
      setTimeout(() => {
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
      }, 50);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [auto]);

  const min = filter ? (LEVELS as any)[filter] : -1;
  const filtered = logs.filter((l) => !filter || ((LEVELS as any)[l.level] ?? 0) >= min);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Logs
            </CardTitle>
            <CardDescription>Últimas 200 linhas em tempo real.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-input accent-primary"
              />
              auto-refresh 5s
            </Label>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-44"
            >
              <option value="">Todos os níveis</option>
              <option value="ERROR">Apenas ERROR</option>
              <option value="WARN">WARN+</option>
              <option value="INFO">INFO+</option>
            </Select>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={ref}
          className="max-h-[600px] overflow-auto rounded-md border border-border bg-black/80 p-3 font-mono text-xs"
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Terminal className="h-6 w-6" />}
              title="Nenhum log para exibir"
              description="Aguardando saída do backend…"
            />
          ) : (
            filtered.map((l, i) => (
              <div
                key={i}
                className="border-b border-border/30 py-0.5 whitespace-pre-wrap break-words last:border-b-0"
              >
                <span className="mr-2 text-muted-foreground/60">{l.time}</span>
                <span className={(LEVEL_COLOR[l.level] || "text-muted-foreground") + " mr-2"}>
                  [{l.level.padEnd(5)}]
                </span>
                <span className="mr-2 text-muted-foreground">{l.logger}</span>
                <span className="text-foreground/90">{l.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
