import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Play, Pause, Trash2, Send } from 'lucide-react';
import { listChannels, createChannel, toggleChannel, deleteChannel } from '../api/client';
import type { Channel } from '../types';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { fmtDate } from '../lib/format';

export default function Channels() {
  const [items, setItems] = useState<Channel[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'telegram', identifier: '' });

  const load = async () => setItems(await listChannels());
  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!form.identifier.trim()) return toast.error('Identificador obrigatório');
    try { await createChannel(form); toast.success('Canal adicionado'); setOpen(false); setForm({ type: 'telegram', identifier: '' }); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Canais de Notificação</h2>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Adicionar</button>
      </div>
      {!items ? <div className="flex justify-center py-12"><Spinner /></div>
        : items.length === 0 ? <div className="text-center text-muted py-12">Nenhum canal cadastrado.</div>
        : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted bg-bg">
              <tr><th className="text-left p-3">Tipo</th><th className="text-left p-3">Identificador</th><th className="text-center p-3">Status</th><th className="text-left p-3">Criado</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-slate-800">
                  <td className="p-3"><span className="badge bg-blue-700 text-white inline-flex items-center gap-1"><Send className="w-3 h-3" /> {c.type}</span></td>
                  <td className="p-3 font-mono text-xs">{c.identifier}</td>
                  <td className="p-3 text-center"><span className={`badge ${c.active ? 'bg-green-600' : 'bg-slate-600'} text-white`}>{c.active ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="p-3 text-xs text-muted">{fmtDate(c.createdAt)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button className="btn-ghost mr-1" onClick={async () => { await toggleChannel(c.id); load(); }}>{c.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</button>
                    <button className="btn-danger" onClick={async () => { if (confirm('Remover canal?')) { await deleteChannel(c.id); toast.success('Removido'); load(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      <Modal open={open} onClose={() => setOpen(false)} title="Adicionar Canal">
        <div className="space-y-3">
          <div><label className="text-xs text-muted">Tipo</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="telegram">Telegram</option></select></div>
          <div><label className="text-xs text-muted">Chat ID *</label><input className="input" placeholder="-100xxxxxxxxxx" value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-3"><button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" onClick={onCreate}><Plus className="w-4 h-4" /> Adicionar</button></div>
        </div>
      </Modal>
    </div>
  );
}
