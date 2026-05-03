export const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
};

export const fmtCurrency = (v?: number | null) =>
  v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtUptime = (sec?: number | null) => {
  if (sec == null) return '—';
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h ${m}min`;
  if (h) return `${h}h ${m}min`;
  return `${m}min`;
};

export const fmtRelative = (s?: string | null) => {
  if (!s) return '—';
  const diff = Math.floor((new Date(s).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diff);
  if (abs < 60)    return diff < 0 ? `${abs}s atrás` : `em ${abs}s`;
  if (abs < 3600)  return diff < 0 ? `${Math.floor(abs/60)}min atrás` : `em ${Math.floor(abs/60)}min`;
  if (abs < 86400) return diff < 0 ? `${Math.floor(abs/3600)}h atrás`  : `em ${Math.floor(abs/3600)}h`;
  return fmtDate(s);
};
