import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { PricePoint } from "@/types";

interface Props {
  data: PricePoint[];
  height?: number;
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
};

export function PriceHistoryChart({ data, height = 280 }: Props) {
  const points = data.map((p) => ({ ts: p.capturedAt, price: Number(p.price) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="ts"
          tickFormatter={fmtDate}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickMargin={8}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickFormatter={(v) => `R$ ${v}`}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
          }}
          labelFormatter={(label) => new Date(label as string).toLocaleString("pt-BR")}
          formatter={(value) => [fmtBRL(Number(value)), "Preço"]}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 5 }}
          isAnimationActive
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
