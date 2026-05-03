export interface Product {
  id: number;
  asin: string;
  title: string;
  niche?: string;
  targetDiscountPct: number;
  active: boolean;
  createdAt: string;
}

export interface Channel {
  id: number;
  type: string;
  identifier: string;
  active: boolean;
  createdAt: string;
}

export interface Promotion {
  id: number;
  asin: string;
  productTitle: string;
  previousPrice: number;
  currentPrice: number;
  discountPct: number;
  detectedAt: string;
  notified: boolean;
}

export interface DashboardStats {
  activeProducts: number;
  totalProducts: number;
  totalPromotions: number;
  pendingPromotions: number;
  totalNotifications: number;
  activeChannels: number;
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  lastRunProductsChecked: number;
  lastRunPromotionsDetected: number;
  nextRunAt: string | null;
  bestDiscountEverPct: number | null;
  uptimeSeconds: number;
  appVersion: string;
  jvmMemoryUsedMb: number;
  jvmMemoryMaxMb: number;
}

export interface CycleResult {
  productsChecked: number;
  promotionsDetected: number;
  errors: number;
  durationMs: number;
}

export interface BroadcastResult {
  sent: boolean;
  asin: string | null;
  reason: string;
  channelsSent: number;
}

export interface LogEntry {
  time: string;
  level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  logger: string;
  message: string;
}
