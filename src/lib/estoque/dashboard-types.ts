export type WeekChartPoint = {
  label: string
  entradas: number
  saidas: number
}

export type DayMovementBucket = {
  entradas: number
  saidas: number
  entryValue: number
}

export type TrendDelta = {
  text: string
  positive: boolean
}
