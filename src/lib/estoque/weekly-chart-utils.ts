import type { WeekChartPoint } from "./dashboard-types"

/** viewBox do SVG (largura × altura). */
export const WEEKLY_CHART_VIEWBOX = { width: 640, height: 260 } as const

/** Padding interno: topo, direita, base, esquerda. */
export const WEEKLY_CHART_PADDING = { t: 20, r: 20, b: 48, l: 48 } as const

export type WeeklyChartPaths = {
  entradasArea: string
  saidasArea: string
  entradasLine: string
  saidasLine: string
}

export type WeeklyChartGridLine = {
  y: number
  tickValue: number
  x1: number
  x2: number
  labelX: number
}

export type WeeklyChartXLabel = {
  x: number
  text: string
}

export type WeeklyMovementsChartGeometry = {
  viewWidth: number
  viewHeight: number
  paths: WeeklyChartPaths
  horizontalGrid: WeeklyChartGridLine[]
  xAxisLabels: WeeklyChartXLabel[]
}

type ScaleFns = {
  xAt: (i: number) => number
  yAt: (v: number) => number
  baseY: number
}

function createScales(
  data: WeekChartPoint[],
  viewW: number,
  viewH: number,
  pad: typeof WEEKLY_CHART_PADDING,
  maxVal: number
): ScaleFns {
  const innerW = viewW - pad.l - pad.r
  const innerH = viewH - pad.t - pad.b
  const baseY = pad.t + innerH

  const xAt = (i: number) =>
    pad.l + (data.length <= 1 ? innerW / 2 : (innerW * i) / (data.length - 1))

  const yAt = (v: number) => pad.t + innerH - (v / maxVal) * innerH

  return { xAt, yAt, baseY }
}

function buildSeriesLinePath(
  data: WeekChartPoint[],
  key: "entradas" | "saidas",
  xAt: (i: number) => number,
  yAt: (v: number) => number
): string {
  return data
    .map((d, i) => {
      const x = xAt(i)
      const y = yAt(d[key])
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
}

function buildSeriesAreaPath(
  data: WeekChartPoint[],
  key: "entradas" | "saidas",
  xAt: (i: number) => number,
  yAt: (v: number) => number,
  baseY: number
): string {
  if (!data.length) return ""
  const top = buildSeriesLinePath(data, key, xAt, yAt)
  const firstX = xAt(0)
  const lastX = xAt(data.length - 1)
  return `${top} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`
}

/** Valores do eixo Y (0 … max), quantidade de faixas = yTickCount. */
export function buildWeeklyChartYTicks(maxVal: number, yTickCount = 4): number[] {
  return Array.from({ length: yTickCount + 1 }, (_, i) =>
    Math.round((maxVal * i) / yTickCount)
  )
}

/** Máximo do eixo Y a partir dos pontos (mínimo visual para escala vazia). */
export function weeklyChartMaxValue(data: WeekChartPoint[], floor = 5): number {
  const values = data.flatMap((d) => [d.entradas, d.saidas])
  return Math.max(floor, ...values)
}

/**
 * Geometria pura do gráfico semanal (paths SVG + grid + rótulos do eixo X).
 * O componente React só injeta `fill` via `url(#id)` e cores.
 */
export function buildWeeklyMovementsChartGeometry(
  data: WeekChartPoint[],
  options?: { yTickCount?: number; scaleFloor?: number }
): WeeklyMovementsChartGeometry {
  const viewWidth = WEEKLY_CHART_VIEWBOX.width
  const viewHeight = WEEKLY_CHART_VIEWBOX.height
  const pad = WEEKLY_CHART_PADDING
  const yTickCount = options?.yTickCount ?? 4
  const floor = options?.scaleFloor ?? 5

  const maxVal = weeklyChartMaxValue(data, floor)
  const { xAt, yAt, baseY } = createScales(data, viewWidth, viewHeight, pad, maxVal)

  const paths: WeeklyChartPaths = {
    entradasArea: buildSeriesAreaPath(data, "entradas", xAt, yAt, baseY),
    saidasArea: buildSeriesAreaPath(data, "saidas", xAt, yAt, baseY),
    entradasLine: buildSeriesLinePath(data, "entradas", xAt, yAt),
    saidasLine: buildSeriesLinePath(data, "saidas", xAt, yAt),
  }

  const tickVals = buildWeeklyChartYTicks(maxVal, yTickCount)
  const horizontalGrid: WeeklyChartGridLine[] = tickVals.map((tickValue) => ({
    y: yAt(tickValue),
    tickValue,
    x1: pad.l,
    x2: viewWidth - pad.r,
    labelX: pad.l - 8,
  }))

  const xAxisLabels: WeeklyChartXLabel[] = data.map((d, i) => ({
    x: xAt(i),
    text: d.label,
  }))

  return {
    viewWidth,
    viewHeight,
    paths,
    horizontalGrid,
    xAxisLabels,
  }
}
