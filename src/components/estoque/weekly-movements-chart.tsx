"use client"

import { useId, useMemo } from "react"
import { estoqueChartColors } from "@/lib/estoque/dashboard-tokens"
import type { WeekChartPoint } from "@/lib/estoque/dashboard-types"
import { buildWeeklyMovementsChartGeometry } from "@/lib/estoque/weekly-chart-utils"

export type WeeklyMovementsChartProps = {
  data: WeekChartPoint[]
}

export function WeeklyMovementsChart({ data }: WeeklyMovementsChartProps) {
  const fillEntId = useId().replace(/:/g, "")
  const fillSaiId = useId().replace(/:/g, "")

  const geom = useMemo(() => buildWeeklyMovementsChartGeometry(data), [data])
  const { entradas: cEnt, saidas: cSai } = estoqueChartColors

  return (
    <svg
      viewBox={`0 0 ${geom.viewWidth} ${geom.viewHeight}`}
      className="h-[220px] w-full max-w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Gráfico de movimentações da semana"
    >
      <defs>
        <linearGradient id={fillEntId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cEnt} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cEnt} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={fillSaiId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cSai} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cSai} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {geom.horizontalGrid.map(({ y, tickValue, x1, x2, labelX }) => (
        <g key={tickValue}>
          <line
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            stroke="currentColor"
            strokeDasharray="4 6"
            className="text-muted-foreground/25"
          />
          <text
            x={labelX}
            y={y + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[11px]"
          >
            {tickValue}
          </text>
        </g>
      ))}

      <path d={geom.paths.entradasArea} fill={`url(#${fillEntId})`} stroke="none" />
      <path d={geom.paths.saidasArea} fill={`url(#${fillSaiId})`} stroke="none" />
      <path d={geom.paths.entradasLine} fill="none" stroke={cEnt} strokeWidth={2.25} strokeLinecap="round" />
      <path d={geom.paths.saidasLine} fill="none" stroke={cSai} strokeWidth={2.25} strokeLinecap="round" />

      {geom.xAxisLabels.map(({ x, text }, i) => (
        <text
          key={`${text}-${i}`}
          x={x}
          y={geom.viewHeight - 16}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px] font-medium capitalize"
        >
          {text}
        </text>
      ))}
    </svg>
  )
}
