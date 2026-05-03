import { X } from 'lucide-react';
interface Props { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }
export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
