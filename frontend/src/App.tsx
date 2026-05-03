import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Promotions from '@/pages/Promotions';
import Channels from '@/pages/Channels';
import Logs from '@/pages/Logs';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/products"   element={<Products />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/channels"   element={<Channels />} />
        <Route path="/logs"       element={<Logs />} />
      </Route>
    </Routes>
  );
}
