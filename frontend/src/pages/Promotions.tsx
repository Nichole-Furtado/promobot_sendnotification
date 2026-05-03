import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { listPromotions } from '../api/client';
import type { Promotion } from '../types';
import Spinner from '../components/Spinner';
import { fmtDate, fmtCurrency } from '../lib/format';

export default function Promotions() {
  const [items, setItems] = useState<Promotion[] | null>(null);
  const load = async () => setItems(await listPromotions());
  useEffect(() => { load(); }, []);
  return (
    <div className="card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Promoções Detectadas (últimas 20)</h2>
        <button className="btn-outline" onClick={load}><RefreshCw className="w-4 h-4" /> Atualizar</button>
      </div>
      {!items ? <div className="flex justify-center py-12"><Spinner /></div>
        : items.length === 0 ? <div className="text-center text-muted py-12">Nenhuma promoção ainda.</div>
        : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted bg-bg">
              <tr>
                <th className="text-left p-3">Produto</th>
                <th className="text-left p-3">ASIN</th>
                <th className="text-right p-3">De</th>
                <th className="text-right p-3">Por</th>
                <th className="text-center p-3">Desconto</th>
                <th className="text-left p-3">Detectado</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-slate-800">
                  <td className="p-3">{p.productTitle.length > 40 ? p.productTitle.slice(0, 40) + '…' : p.productTitle}</td>
                  <td className="p-3"><a className="text-accent font-mono" href={`https://www.amazon.com.br/dp/${p.asin}`} target="_blank">{p.asin}</a></td>
                  <td className="p-3 text-right text-muted line-through">{fmtCurrency(p.previousPrice)}</td>
                  <td className="p-3 text-right text-green-400 font-semibold">{fmtCurrency(p.currentPrice)}</td>
                  <td className="p-3 text-center"><span className="badge bg-green-600 text-white">-{Math.round(Number(p.discountPct))}%</span></td>
                  <td className="p-3 text-xs text-muted">{fmtDate(p.detectedAt)}</td>
                  <td className="p-3 text-center"><span className={`badge ${p.notified ? 'bg-blue-600' : 'bg-yellow-600'} text-white`}>{p.notified ? 'Enviado' : 'Pendente'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
}
