"use client"

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

/**
 * Barres d'une seule série (une teinte : bleu de marque, contraste ≥ 3:1 sur fond clair ;
 * le vert de marque #AACD06 échoue à 1,8:1). Pas de légende : le titre nomme la série.
 * Valeurs écrites au bout des barres + tableau accessible (lecteurs d'écran).
 */
export interface BarDatum {
  label: string
  value: number
}

interface SimpleBarChartProps {
  data: BarDatum[]
  /** Nom de la série (tooltip et tableau) */
  seriesName: string
  formatValue?: (value: number) => string
  orientation?: "horizontal" | "vertical"
  height?: number
}

const MARK = "var(--chart-1)"
const INK_MUTED = "var(--muted-foreground)"

function ChartTooltip({ active, payload, seriesName, formatValue }: {
  active?: boolean
  payload?: Array<{ payload: BarDatum }>
  seriesName: string
  formatValue: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{d.label}</p>
      <p className="text-muted-foreground">
        {seriesName} : <span className="text-foreground">{formatValue(d.value)}</span>
      </p>
    </div>
  )
}

export default function SimpleBarChart({
  data,
  seriesName,
  formatValue = (v) => String(v),
  orientation = "horizontal",
  height,
}: SimpleBarChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Aucune donnée pour le moment.</p>
  }
  const horizontal = orientation === "horizontal"
  const chartHeight = height ?? (horizontal ? Math.max(120, data.length * 40 + 24) : 240)

  return (
    <div>
      <div aria-hidden="true" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 8, right: horizontal ? 72 : 8, bottom: 0, left: 0 }}
            barCategoryGap={horizontal ? 10 : "25%"}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="0" horizontal={!horizontal} vertical={horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false}
                  tick={{ fill: INK_MUTED, fontSize: 12 }} />
              </>
            ) : (
              <>
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--border)" }} tick={{ fill: INK_MUTED, fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fill: INK_MUTED, fontSize: 12 }} />
              </>
            )}
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={<ChartTooltip seriesName={seriesName} formatValue={formatValue} />}
            />
            <Bar dataKey="value" fill={MARK} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={28}>
              <LabelList
                dataKey="value"
                position={horizontal ? "right" : "top"}
                formatter={(v: unknown) => formatValue(Number(v))}
                style={{ fill: "var(--foreground)", fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{seriesName}</caption>
        <thead>
          <tr><th scope="col">Catégorie</th><th scope="col">{seriesName}</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><th scope="row">{d.label}</th><td>{formatValue(d.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Objet {catégorie: montant} → barres triées par valeur décroissante. */
export function recordToBars(record: Record<string, number> | null | undefined): BarDatum[] {
  return Object.entries(record ?? {})
    .map(([label, value]) => ({ label, value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value)
}
