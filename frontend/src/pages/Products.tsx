import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Play, Pause, Trash2, Megaphone, ExternalLink, Play as PlayIcon } from 'lucide-react';
import { listProducts, createProduct, toggleProduct, deleteProduct, runNow, broadcastNext } from '../api/client';
import type { Product } from '../types';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { fmtDate } from '../lib/format';

const NICHES = ['Moda', 'Saúde', 'Eletrônicos', 'Casa', 'Esportes', 'Outros'];

export default function Products() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ asin: '', title: '', niche: 'Outros', targetDiscountPct: 10 });

  const load = async () => { try { setItems(await listProducts()); } catch (e: any) { toast.error('Erro: ' + e.message); } };
  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (form.asin.length !== 10) return toast.error('ASIN deve ter 10 caracteres');
    if (!form.title.trim()) return toast.error('Título obrigatório');
    setBusy(true);
    try { await createProduct(form); toast.success('Produto adicionado'); setOpen(false); setForm({ asin: '', title: '', niche: 'Outros', targetDiscountPct: 10 }); load(); }
    catch (e: any) { toast.error('Erro: ' + (e.response?.data?.message || e.message)); }
    finally { setBusy(false); }
  };

  const onToggle = async (id: number) => { try { await toggleProduct(id); load(); } catch (e: any) { toast.error(e.message); } };
  const onDelete = async (id: number) => { if (!confirm('Remover este produto?')) return; try { await deleteProduct(id); toast.success('Removido'); load(); } catch (e: any) { toast.error(e.message); } };

  const onRunNow = async () => {
    const t = toast.loading('Executando ciclo…');
    try { const r = await runNow(); toast.success(`${r.productsChecked} produtos · ${r.promotionsDetected} promoções · ${r.errors} erros`, { id: t }); load(); }
    catch (e: any) { toast.error(e.message, { id: t }); }
  };

  const onBroadcast = async () => {
    const t = toast.loading('Enviando próximo…');
    try { const r = await broadcastNext(); toast.success(r.sent ? `Enviado ASIN ${r.asin} para ${r.channelsSent} canal(is)` : `Não enviado: ${r.reason}`, { id: t }); }
    catch (e: any) { toast.error(e.message, { id: t }); }
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <h2 className="font-semibold">Produtos Monitorados</h2>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onBroadcast}><Megaphone className="w-4 h-4" /> Enviar Próximo</button>
          <button className="btn-outline" onClick={onRunNow}><PlayIcon className="w-4 h-4" /> Executar Agora</button>
          <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Adicionar</button>
        </div>
      </div>

      {!items ? <div className="flex justify-center py-12"><Spinner /></div>
        : items.length === 0 ? <div className="text-center text-muted py-12">Nenhum produto cadastrado.</div>
        : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted bg-bg">
              <tr>
                <th className="text-left p-3">ASIN</th>
                <th className="text-left p-3">Título</th>
                <th className="text-left p-3">Nicho</th>
                <th className="text-center p-3">Desc. Mín.</th>
                <th className="text-center p-3">Status</th>
                <th className="text-left p-3">Adicionado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-slate-800">
                  <td className="p-3"><a href={`https://www.amazon.com.br/dp/${p.asin}`} target="_blank" className="text-accent font-mono inline-flex items-center gap-1">{p.asin}<ExternalLink className="w-3 h-3" /></a></td>
                  <td className="p-3">{p.title.length > 50 ? p.title.slice(0, 50) + '…' : p.title}</td>
                  <td className="p-3">{p.niche || '—'}</td>
                  <td className="p-3 text-center"><span className="badge bg-cyan-700 text-white">{p.targetDiscountPct}%</span></td>
                  <td className="p-3 text-center"><span className={`badge ${p.active ? 'bg-green-600' : 'bg-slate-600'} text-white`}>{p.active ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="p-3 text-xs text-muted">{fmtDate(p.createdAt)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button className="btn-ghost mr-1" onClick={() => onToggle(p.id)}>{p.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</button>
                    <button className="btn-danger" onClick={() => onDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="Adicionar Produto">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted">ASIN *</label>
            <input className="input" maxLength={10} value={form.asin} onChange={e => setForm(f => ({ ...f, asin: e.target.value.toUpperCase() }))} placeholder="B0XXXXXXXX" />
          </div>
          <div>
            <label className="text-xs text-muted">Título *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted">Nicho</label>
              <select className="input" value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}>
                {NICHES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Desconto mínimo (%)</label>
              <input type="number" min={1} max={99} className="input" value={form.targetDiscountPct} onChange={e => setForm(f => ({ ...f, targetDiscountPct: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={onCreate} disabled={busy}>{busy ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />} Adicionar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
