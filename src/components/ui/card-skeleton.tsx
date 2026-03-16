"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-48" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-2">
          <Skeleton className="h-9 w-20 mx-auto mb-2" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}
