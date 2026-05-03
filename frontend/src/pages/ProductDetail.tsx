import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, LineChart as LineIcon, TrendingDown, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { getProduct, getProductPriceHistory } from "@/api/client";
import type { Product, PricePoint } from "@/types";

const RANGES = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 180, label: "180 dias" },
];

const fmtBRL = (v: number | null | undefined) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    Promise.all([getProduct(productId), getProductPriceHistory(productId, days)])
      .then(([p, h]) => {
        setProduct(p);
        setHistory(h);
      })
      .catch((e) => toast.error("Erro ao carregar produto: " + e.message))
      .finally(() => setLoading(false));
  }, [productId, days]);

  if (loading && !product) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        icon={<LineIcon className="h-6 w-6" />}
        title="Produto não encontrado"
        description="Verifique o link e tente novamente."
        action={
          <Button asChild variant="outline">
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
    );
  }

  const prices = history.map((h) => Number(h.price));
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const current = prices.length ? prices[prices.length - 1] : null;
  const first = prices.length ? prices[0] : null;
  const variation = first != null && current != null && first > 0 ? ((current - first) / first) * 100 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Voltar">
            <Link to="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold leading-tight">{product.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5">{product.asin}</code>
              {product.niche && <Badge variant="secondary">{product.niche}</Badge>}
              <Badge variant={product.active ? "success" : "secondary"}>
                {product.active ? "Ativo" : "Inativo"}
              </Badge>
              <span>Alvo: -{Number(product.targetDiscountPct).toFixed(0)}%</span>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <a
            href={`https://www.amazon.com.br/dp/${product.asin}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Amazon
          </a>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Preço atual" value={fmtBRL(current)} tone="primary" />
        <StatTile label="Mínimo no período" value={fmtBRL(min)} tone="success" />
        <StatTile label="Máximo no período" value={fmtBRL(max)} tone="warning" />
        <StatTile
          label="Variação"
          value={variation == null ? "—" : `${variation > 0 ? "+" : ""}${variation.toFixed(1)}%`}
          tone={variation == null ? "default" : variation < 0 ? "success" : variation > 0 ? "warning" : "default"}
          icon={
            variation != null && variation < 0 ? (
              <TrendingDown className="h-4 w-4" />
            ) : variation != null && variation > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : undefined
          }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineIcon className="h-4 w-4 text-primary" />
            Histórico de preço
          </CardTitle>
          <Select
            value={String(days)}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-[140px]"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : history.length < 2 ? (
            <EmptyState
              icon={<LineIcon className="h-6 w-6" />}
              title="Sem histórico suficiente"
              description={`Apenas ${history.length} captura${history.length === 1 ? "" : "s"} no período. O scheduler precisa de pelo menos 2 ciclos para gerar um gráfico útil.`}
            />
          ) : (
            <PriceHistoryChart data={history} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const TONE_CLASS: Record<string, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
};

function StatTile({
  label,
  value,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  tone?: keyof typeof TONE_CLASS;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums ${TONE_CLASS[tone]}`}>
          {icon}
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
