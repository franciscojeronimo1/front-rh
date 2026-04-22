"use client"

import { useId, useMemo } from "react"
import { buildSparklineGeometry } from "@/lib/estoque/dashboard-utils"

const W = 112
const H = 40

export type MiniSparklineProps = {
  values: number[]
  stroke: string
  lineOnly?: boolean
}

export function MiniSparkline({ values, stroke, lineOnly }: MiniSparklineProps) {
  const gradId = useId().replace(/:/g, "")
  const geom = useMemo(() => buildSparklineGeometry(values, W, H), [values])

  if (!geom) {
    return <div className="h-10 w-28" aria-hidden />
  }

  return (
    <svg width={W} height={H} className="shrink-0 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {!lineOnly && <path d={geom.area} fill={`url(#${gradId})`} stroke="none" />}
      <path
        d={geom.line}
        fill="none"
        stroke={stroke}
        strokeWidth={lineOnly ? 2 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
