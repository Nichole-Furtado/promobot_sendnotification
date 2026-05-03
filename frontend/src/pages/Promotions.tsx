import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Megaphone, RefreshCw } from "lucide-react";
import { listPromotions } from "@/api/client";
import type { Promotion } from "@/types";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/data-table";

export default function Promotions() {
  const [items, setItems] = useState<Promotion[] | null>(null);

  const load = async () => setItems(await listPromotions());
  useEffect(() => {
    load();
  }, []);

  const columns = useMemo<ColumnDef<Promotion>[]>(
    () => [
      {
        accessorKey: "productTitle",
        header: "Produto",
        cell: ({ row }) => (
          <span className="block max-w-[280px] truncate font-medium" title={row.original.productTitle}>
            {row.original.productTitle}
          </span>
        ),
      },
      {
        accessorKey: "asin",
        header: "ASIN",
        cell: ({ row }) => (
          <a
            href={`https://www.amazon.com.br/dp/${row.original.asin}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
          >
            {row.original.asin} <ExternalLink className="h-3 w-3" />
          </a>
        ),
      },
      {
        accessorKey: "previousPrice",
        header: () => <span className="block text-right">De</span>,
        cell: ({ row }) => (
          <span className="block text-right text-xs text-muted-foreground line-through tabular-nums">
            {fmtCurrency(row.original.previousPrice)}
          </span>
        ),
      },
      {
        accessorKey: "currentPrice",
        header: () => <span className="block text-right">Por</span>,
        cell: ({ row }) => (
          <span className="block text-right font-semibold text-success tabular-nums">
            {fmtCurrency(row.original.currentPrice)}
          </span>
        ),
      },
      {
        accessorKey: "discountPct",
        header: () => <span className="block text-center">Desconto</span>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant="success">-{Math.round(Number(row.original.discountPct))}%</Badge>
          </div>
        ),
      },
      {
        accessorKey: "detectedAt",
        header: "Detectado",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{fmtDate(row.original.detectedAt)}</span>
        ),
      },
      {
        accessorKey: "notified",
        header: () => <span className="block text-center">Status</span>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.original.notified ? "default" : "warning"}>
              {row.original.notified ? "Enviado" : "Pendente"}
            </Badge>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Promoções detectadas</CardTitle>
            <CardDescription>Histórico das últimas detecções pelo scraper.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!items ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            searchPlaceholder="Buscar por título ou ASIN…"
            emptyState={
              <EmptyState
                icon={<Megaphone className="h-6 w-6" />}
                title="Nenhuma promoção ainda"
                description="As detecções aparecerão aqui quando o scraper rodar."
              />
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
