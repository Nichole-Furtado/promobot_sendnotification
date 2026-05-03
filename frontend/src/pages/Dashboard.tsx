import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Play, RefreshCw } from 'lucide-react';
import { getDashboard, listPromotions, runNow } from '../api/client';
import type { DashboardStats, Promotion } from '../types';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import { fmtDate, fmtRelative, fmtUptime, fmtCurrency } from '../lib/format';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [running, setRunning] = useState(false);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([getDashboard(), listPromotions()]);
      setStats(s); setPromos(p);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);

  const onRun = async () => {
    setRunning(true);
    try {
      const r = await runNow();
      toast.success(`Ciclo: ${r.productsChecked} produtos · ${r.promotionsDetected} promoções · ${r.errors} erros (${r.durationMs}ms)`);
      await load();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setRunning(false); }
  };

  if (!stats) return <div className="flex justify-center py-12"><Spinner /></div>;

  const memPct = stats.jvmMemoryMaxMb > 0 ? (stats.jvmMemoryUsedMb / stats.jvmMemoryMaxMb) * 100 : 0;
  const memColor = memPct > 85 ? 'bg-red-500' : memPct > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <button className="btn-primary" onClick={onRun} disabled={running}>
          {running ? <Spinner size="sm" /> : <Play className="w-4 h-4" />} Executar Agora
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Produtos Ativos"  value={stats.activeProducts}    sub={`${stats.totalProducts} cadastrados`} tone="warning" />
        <StatCard label="Promoções"        value={stats.totalPromotions}   sub={`${stats.pendingPromotions} pendentes`} tone="info" />
        <StatCard label="Notificações"     value={stats.totalNotifications} sub="total enviadas" tone="success" />
        <StatCard label="Canais Ativos"    value={stats.activeChannels}    sub="Telegram conectados" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="stat-label mb-1">Último Ciclo</div>
          <div className="font-semibold">{stats.lastRunAt ? fmtDate(stats.lastRunAt) : 'nunca'}</div>
          <div className="text-xs text-muted mt-1">
            {stats.lastRunDurationMs != null
              ? `${stats.lastRunProductsChecked} produtos · ${stats.lastRunPromotionsDetected} novas em ${stats.lastRunDurationMs}ms`
              : 'aguardando primeira execução'}
          </div>
        </div>
        <div className="card p-4">
          <div className="stat-label mb-1">Próxima Execução</div>
          <div className="font-semibold">{stats.nextRunAt ? fmtDate(stats.nextRunAt) : '—'}</div>
          <div className="text-xs text-muted mt-1">{stats.nextRunAt ? fmtRelative(stats.nextRunAt) : 'cron 0 0/30 * * * ?'}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label mb-1">Maior Desconto</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.bestDiscountEverPct != null ? `-${Math.round(Number(stats.bestDiscountEverPct))}%` : '—'}
          </div>
          <div className="text-xs text-muted mt-1">já detectado</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="stat-label mb-2">Sistema</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex justify-between"><span>Uptime</span><span className="text-accent font-semibold">{fmtUptime(stats.uptimeSeconds)}</span></div>
          <div className="flex justify-between"><span>Versão</span><span className="text-muted">v{stats.appVersion}</span></div>
          <div>
            <div className="flex justify-between mb-1"><span>Memória JVM</span><span className="text-muted">{stats.jvmMemoryUsedMb}/{stats.jvmMemoryMaxMb} MB</span></div>
            <div className="h-1.5 bg-bg rounded overflow-hidden"><div className={memColor + ' h-full'} style={{ width: `${memPct}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Últimas Promoções</h3>
          <button className="btn-outline" onClick={load}><RefreshCw className="w-4 h-4" /></button>
        </div>
        {promos.length === 0 ? (
          <div className="text-center text-muted py-8">Nenhuma promoção detectada ainda.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted bg-bg">
              <tr>
                <th className="text-left p-3">Produto</th>
                <th className="text-left p-3">ASIN</th>
                <th className="text-right p-3">De</th>
                <th className="text-right p-3">Por</th>
                <th className="text-center p-3">Desconto</th>
                <th className="text-left p-3">Detectado</th>
              </tr>
            </thead>
            <tbody>
              {promos.slice(0, 10).map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-slate-800">
                  <td className="p-3">{p.productTitle.length > 40 ? p.productTitle.slice(0, 40) + '…' : p.productTitle}</td>
                  <td className="p-3"><a href={`https://www.amazon.com.br/dp/${p.asin}`} target="_blank" className="text-accent font-mono text-xs">{p.asin}</a></td>
                  <td className="p-3 text-right text-muted line-through">{fmtCurrency(p.previousPrice)}</td>
                  <td className="p-3 text-right text-green-400 font-semibold">{fmtCurrency(p.currentPrice)}</td>
                  <td className="p-3 text-center"><span className="badge bg-green-600 text-white">-{Math.round(Number(p.discountPct))}%</span></td>
                  <td className="p-3 text-xs text-muted">{fmtDate(p.detectedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
