import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { Spinner } from '@/components/ui/spinner';

const Dashboard      = lazy(() => import('@/pages/Dashboard'));
const Products       = lazy(() => import('@/pages/Products'));
const ProductDetail  = lazy(() => import('@/pages/ProductDetail'));
const Promotions     = lazy(() => import('@/pages/Promotions'));
const Channels       = lazy(() => import('@/pages/Channels'));
const Logs           = lazy(() => import('@/pages/Logs'));

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
        <Route path="/products"      element={<Suspense fallback={<PageFallback />}><Products /></Suspense>} />
        <Route path="/products/:id"  element={<Suspense fallback={<PageFallback />}><ProductDetail /></Suspense>} />
        <Route path="/promotions"    element={<Suspense fallback={<PageFallback />}><Promotions /></Suspense>} />
        <Route path="/channels"      element={<Suspense fallback={<PageFallback />}><Channels /></Suspense>} />
        <Route path="/logs"          element={<Suspense fallback={<PageFallback />}><Logs /></Suspense>} />
      </Route>
    </Routes>
  );
}
