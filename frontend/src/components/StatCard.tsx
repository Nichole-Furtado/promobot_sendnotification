interface Props { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'default' | 'warning' | 'success' | 'info'; }
const tones = { default: 'text-slate-100', warning: 'text-accent', success: 'text-green-400', info: 'text-cyan-400' };
export default function StatCard({ label, value, sub, tone = 'default' }: Props) {
  return (
    <div className="card p-4">
      <div className="stat-label">{label}</div>
      <div className={`text-3xl font-bold leading-tight ${tones[tone]}`}>{value}</div>
      {sub != null && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
