import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity, BadgePercent, Bell, Boxes, Cpu, ExternalLink, Megaphone, Play, RefreshCw, Send, Timer, TrendingDown,
} from "lucide-react";
import { getDashboard, listPromotions, runNow } from "@/api/client";
import type { DashboardStats, Promotion } from "@/types";
import { fmtCurrency, fmtDate, fmtRelative, fmtUptime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/stat-card";
import { DiscountDistributionChart } from "@/components/charts/discount-distribution-chart";
import { NotificationStatusChart } from "@/components/charts/notification-status-chart";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function fmtCountdown(targetIso: string | null, now: number): string {
  if (!targetIso) return "—";
  const diff = Math.floor((new Date(targetIso).getTime() - now) / 1000);
  if (diff <= 0) return "agora";
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}min`;
  }
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [running, setRunning] = useState(false);
  const now = useNow(1000);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([getDashboard(), listPromotions()]);
      setStats(s);
      setPromos(p);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const onRun = async () => {
    setRunning(true);
    const t = toast.loading("Executando ciclo…");
    try {
      const r = await runNow();
      toast.success(
        `${r.productsChecked} produtos · ${r.promotionsDetected} promoções · ${r.errors} erros (${r.durationMs}ms)`,
        { id: t }
      );
      await load();
    } catch (e: any) {
      toast.error("Erro: " + e.message, { id: t });
    } finally {
      setRunning(false);
    }
  };

  const memPct = useMemo(() => {
    if (!stats || stats.jvmMemoryMaxMb <= 0) return 0;
    return (stats.jvmMemoryUsedMb / stats.jvmMemoryMaxMb) * 100;
  }, [stats]);

  const memColor = memPct > 85 ? "bg-destructive" : memPct > 70 ? "bg-warning" : "bg-success";

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const recentPromos = promos.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Visão geral</h2>
          <p className="text-sm text-muted-foreground">Métricas em tempo real do orquestrador.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={onRun} disabled={running} size="sm">
            {running ? <Spinner size="sm" className="border-primary-foreground" /> : <Play className="h-4 w-4" />}
            Executar agora
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Produtos ativos"
          value={stats.activeProducts}
          sub={`${stats.totalProducts} cadastrados`}
          tone="primary"
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatCard
          label="Promoções"
          value={stats.totalPromotions}
          sub={`${stats.pendingPromotions} pendentes`}
          tone="info"
          icon={<BadgePercent className="h-4 w-4" />}
        />
        <StatCard
          label="Notificações"
          value={stats.totalNotifications}
          sub="total enviadas"
          tone="success"
          icon={<Bell className="h-4 w-4" />}
        />
        <StatCard
          label="Canais"
          value={stats.activeChannels}
          sub="Telegram conectados"
          tone="warning"
          icon={<Send className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Último ciclo
            </CardDescription>
            <CardTitle className="text-base">
              {stats.lastRunAt ? fmtDate(stats.lastRunAt) : "Nunca executado"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.lastRunDurationMs != null
                ? `${stats.lastRunProductsChecked} produtos · ${stats.lastRunPromotionsDetected} novas em ${stats.lastRunDurationMs}ms`
                : "Aguardando primeira execução"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" /> Próxima execução
            </CardDescription>
            <CardTitle className="text-base tabular-nums">
              {fmtCountdown(stats.nextRunAt, now)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.nextRunAt ? fmtRelative(stats.nextRunAt) : "cron 0 0/30 * * * ?"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" /> Maior desconto
            </CardDescription>
            <CardTitle className="text-2xl text-success tabular-nums">
              {stats.bestDiscountEverPct != null ? `-${Math.round(Number(stats.bestDiscountEverPct))}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">já detectado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por desconto</CardTitle>
            <CardDescription>Quantas promoções em cada faixa.</CardDescription>
          </CardHeader>
          <CardContent>
            <DiscountDistributionChart promotions={promos} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status de notificação</CardTitle>
            <CardDescription>Enviadas vs. pendentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationStatusChart promotions={promos} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Sistema
              </CardTitle>
              <CardDescription>Estado do runtime JVM.</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">v{stats.appVersion}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-semibold tabular-nums text-accent">{fmtUptime(stats.uptimeSeconds)}</span>
            </div>
            <Separator orientation="vertical" className="hidden h-10 md:block justify-self-center" />
            <div className="md:col-span-1">
              <div className="mb-1 flex justify-between">
                <span className="text-muted-foreground">Memória JVM</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {stats.jvmMemoryUsedMb}/{stats.jvmMemoryMaxMb} MB
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={memColor + " h-full transition-all"}
                  style={{ width: `${Math.min(100, memPct)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Últimas promoções</CardTitle>
              <CardDescription>As 8 detecções mais recentes.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recentPromos.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-6 w-6" />}
              title="Nenhuma promoção detectada"
              description="Cadastre produtos e aguarde o próximo ciclo do scraper."
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentPromos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.productTitle}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <a
                        href={`https://www.amazon.com.br/dp/${p.asin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-accent hover:underline"
                      >
                        {p.asin} <ExternalLink className="h-3 w-3" />
                      </a>
                      <span>·</span>
                      <span>{fmtDate(p.detectedAt)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground line-through tabular-nums">
                        {fmtCurrency(p.previousPrice)}
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-success">
                        {fmtCurrency(p.currentPrice)}
                      </p>
                    </div>
                    <Badge variant="success">-{Math.round(Number(p.discountPct))}%</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
