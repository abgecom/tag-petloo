import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string
  change: string
  icon: string
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isPositive = change.startsWith("+")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <span className="text-2xl">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className={`text-xs ${isPositive ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
          <span className="mr-1">{isPositive ? "↗️" : "↘️"}</span>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}
