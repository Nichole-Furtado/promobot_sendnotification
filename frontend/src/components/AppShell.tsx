import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Tag,
  Send,
  Terminal,
  Zap,
  Menu,
  Sun,
  Moon,
  Monitor,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/lib/theme';
import { getHealth } from '@/api/client';
import { cn } from '@/lib/utils';

interface NavItem { to: string; label: string; icon: LucideIcon; }

const NAV: NavItem[] = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/products',   label: 'Produtos',   icon: Package },
  { to: '/promotions', label: 'Promoções',  icon: Tag },
  { to: '/channels',   label: 'Canais',     icon: Send },
  { to: '/logs',       label: 'Logs',       icon: Terminal },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-border px-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Zap className="h-4 w-4" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight">PromoBot</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Orquestrador</span>
      </div>
    </div>
  );
}

function HealthBadge() {
  const [health, setHealth] = useState<'UP' | 'DOWN' | 'UNKNOWN'>('UNKNOWN');
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try { const h = await getHealth(); if (!cancelled) setHealth(h.status === 'UP' ? 'UP' : 'DOWN'); }
      catch { if (!cancelled) setHealth('DOWN'); }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const label = health === 'UP' ? 'Online' : health === 'DOWN' ? 'Offline' : 'Verificando…';
  const color =
    health === 'UP' ? 'bg-success text-success-foreground'
    : health === 'DOWN' ? 'bg-destructive text-destructive-foreground'
    : 'bg-muted text-muted-foreground';
  const dot =
    health === 'UP' ? 'bg-success animate-pulse'
    : health === 'DOWN' ? 'bg-destructive'
    : 'bg-muted-foreground';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', color)}>
            <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dot)} />
            <Activity className="h-3 w-3" />
            <span className="hidden sm:inline">{label}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Status do backend (poll a cada 10s)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Alternar tema">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" /> Claro {theme === 'light' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" /> Escuro {theme === 'dark' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" /> Sistema {theme === 'system' && '✓'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PageTitle() {
  const { pathname } = useLocation();
  const item = NAV.find((n) => pathname.startsWith(n.to));
  if (!item) return null;
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-semibold">{item.label}</span>
    </div>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  // fechar drawer ao trocar de rota
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto border-t border-border p-4 text-xs text-muted-foreground">
          v1.0.0 · MIT
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
          {/* Trigger mobile */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navegação</SheetTitle>
              <Brand />
              <NavList onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <PageTitle />

          <Separator orientation="vertical" className="mx-1 hidden h-6 lg:block" />

          <div className="ml-auto flex items-center gap-2">
            <HealthBadge />
            <ThemeToggle />
          </div>
        </header>

        {/* Conteudo */}
        <main className="flex-1 px-4 py-6 lg:px-6">
          <div className="mx-auto w-full max-w-screen-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
