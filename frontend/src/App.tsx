import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Send, Terminal, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHealth } from './api/client';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Promotions from './pages/Promotions';
import Channels from './pages/Channels';
import Logs from './pages/Logs';

const tabs = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/products',   label: 'Produtos',   icon: Package },
  { to: '/promotions', label: 'Promoções',  icon: Tag },
  { to: '/channels',   label: 'Canais',     icon: Send },
  { to: '/logs',       label: 'Logs',       icon: Terminal },
];

export default function App() {
  const [health, setHealth] = useState<'UP' | 'DOWN' | 'UNKNOWN'>('UNKNOWN');

  useEffect(() => {
    const tick = async () => {
      try { const h = await getHealth(); setHealth(h.status === 'UP' ? 'UP' : 'DOWN'); }
      catch { setHealth('DOWN'); }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-panel border-b border-border px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2 text-accent font-bold text-xl">
          <Zap className="w-5 h-5" /> PromoBot
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={
            'inline-block w-2 h-2 rounded-full ' +
            (health === 'UP' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]'
             : health === 'DOWN' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
             : 'bg-slate-500')
          } />
          <span className={health === 'UP' ? 'text-green-400' : health === 'DOWN' ? 'text-red-400' : 'text-muted'}>
            {health === 'UP' ? 'online' : health === 'DOWN' ? 'offline' : 'verificando…'}
          </span>
        </div>
        <div className="ml-auto flex gap-1">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition ' +
                (isActive ? 'bg-slate-700 text-white' : 'text-muted hover:text-white hover:bg-slate-800')
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-6 py-6 max-w-screen-2xl w-full mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/products"   element={<Products />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/channels"   element={<Channels />} />
          <Route path="/logs"       element={<Logs />} />
        </Routes>
      </main>
    </div>
  );
}
