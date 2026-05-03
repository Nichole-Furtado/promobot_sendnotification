import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import toast from "react-hot-toast";
import { Pause, Play, Plus, Send, Trash2 } from "lucide-react";
import {
  createChannel, deleteChannel, listChannels, toggleChannel,
} from "@/api/client";
import type { Channel } from "@/types";
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

const EMPTY_FORM = { type: "telegram", identifier: "" };

export default function Channels() {
  const [items, setItems] = useState<Channel[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = async () => setItems(await listChannels());
  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!form.identifier.trim()) return toast.error("Identificador obrigatório");
    try {
      await createChannel(form);
      toast.success("Canal adicionado");
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onToggle = async (id: number) => {
    try {
      await toggleChannel(id);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteChannel(id);
      toast.success("Removido");
      setConfirmId(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const columns = useMemo<ColumnDef<Channel>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline" className="inline-flex items-center gap-1">
            <Send className="h-3 w-3" /> {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "identifier",
        header: "Identificador",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.identifier}</span>,
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
        header: "Criado",
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
            <Button variant="ghost" size="icon" onClick={() => onToggle(row.original.id)}>
              {row.original.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmId(row.original.id)}>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Canais de notificação</CardTitle>
              <CardDescription>Para onde as promoções detectadas serão enviadas.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Adicionar
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
              searchPlaceholder="Buscar por tipo ou identificador…"
              pageSize={10}
              emptyState={
                <EmptyState
                  icon={<Send className="h-6 w-6" />}
                  title="Nenhum canal cadastrado"
                  description="Adicione um chat ID do Telegram para receber as notificações."
                  action={
                    <Button onClick={() => setOpen(true)}>
                      <Plus className="h-4 w-4" /> Adicionar canal
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
            <DialogTitle>Adicionar canal</DialogTitle>
            <DialogDescription>Use o chat ID do Telegram (ex.: -100XXXXXXXXXX para grupos).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ctype">Tipo</Label>
              <Select
                id="ctype"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="telegram">Telegram</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cid">Chat ID *</Label>
              <Input
                id="cid"
                placeholder="-100xxxxxxxxxx"
                value={form.identifier}
                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover canal?</DialogTitle>
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
