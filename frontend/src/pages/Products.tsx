import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import toast from "react-hot-toast";
import {
  ExternalLink, Megaphone, Package, Pause, Play, Plus, Trash2,
} from "lucide-react";
import {
  broadcastNext, createProduct, deleteProduct, listProducts, runNow, toggleProduct,
} from "@/api/client";
import type { Product } from "@/types";
import { fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/data-table";

const NICHES = ["Moda", "Saúde", "Eletrônicos", "Casa", "Esportes", "Outros"];
const EMPTY_FORM = { asin: "", title: "", niche: "Outros", targetDiscountPct: 10 };

export default function Products() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = async () => {
    try {
      setItems(await listProducts());
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (form.asin.length !== 10) return toast.error("ASIN deve ter 10 caracteres");
    if (!form.title.trim()) return toast.error("Título obrigatório");
    setBusy(true);
    try {
      await createProduct(form);
      toast.success("Produto adicionado");
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) {
      toast.error("Erro: " + (e.response?.data?.message || e.message));
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (id: number) => {
    try {
      await toggleProduct(id);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteProduct(id);
      toast.success("Removido");
      setConfirmId(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onRunNow = async () => {
    const t = toast.loading("Executando ciclo…");
    try {
      const r = await runNow();
      toast.success(
        `${r.productsChecked} produtos · ${r.promotionsDetected} promoções · ${r.errors} erros`,
        { id: t }
      );
      load();
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
  };

  const onBroadcast = async () => {
    const t = toast.loading("Enviando próximo…");
    try {
      const r = await broadcastNext();
      toast.success(
        r.sent ? `Enviado ASIN ${r.asin} para ${r.channelsSent} canal(is)` : `Não enviado: ${r.reason}`,
        { id: t }
      );
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
  };

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
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
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <span className="block max-w-[320px] truncate font-medium" title={row.original.title}>
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "niche",
        header: "Nicho",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.niche || "—"}</span>
        ),
      },
      {
        accessorKey: "targetDiscountPct",
        header: () => <span className="block text-center">Desc. mín.</span>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant="outline" className="tabular-nums">{row.original.targetDiscountPct}%</Badge>
          </div>
        ),
      },
      {
        accessorKey: "active",
        header: () => <span className="block text-center">Status</span>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.original.active ? "success" : "secondary"}>
              {row.original.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Adicionado",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{fmtDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onToggle(row.original.id)} title={row.original.active ? "Pausar" : "Ativar"}>
              {row.original.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmId(row.original.id)} title="Remover">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Produtos monitorados</CardTitle>
              <CardDescription>Cadastre ASINs da Amazon BR para o scraper acompanhar.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onBroadcast}>
                <Megaphone className="h-4 w-4" /> Enviar próximo
              </Button>
              <Button variant="outline" size="sm" onClick={onRunNow}>
                <Play className="h-4 w-4" /> Executar agora
              </Button>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
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
              searchPlaceholder="Buscar por ASIN, título, nicho…"
              emptyState={
                <EmptyState
                  icon={<Package className="h-6 w-6" />}
                  title="Nenhum produto cadastrado"
                  description="Adicione um produto da Amazon BR pelo ASIN para começar a monitorar."
                  action={
                    <Button onClick={() => setOpen(true)}>
                      <Plus className="h-4 w-4" /> Adicionar produto
                    </Button>
                  }
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar produto</DialogTitle>
            <DialogDescription>O ASIN tem 10 caracteres e fica na URL da Amazon.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="asin">ASIN *</Label>
              <Input
                id="asin"
                maxLength={10}
                value={form.asin}
                onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value.toUpperCase() }))}
                placeholder="B0XXXXXXXX"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: Fone Bluetooth XYZ"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="niche">Nicho</Label>
                <Select
                  id="niche"
                  value={form.niche}
                  onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
                >
                  {NICHES.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount">Desconto mínimo (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={1}
                  max={99}
                  value={form.targetDiscountPct}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetDiscountPct: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onCreate} disabled={busy}>
              {busy ? <Spinner size="sm" className="border-primary-foreground" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover produto?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmId && onDelete(confirmId)}>
              <Trash2 className="h-4 w-4" /> Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
