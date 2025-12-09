import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Activity, Stethoscope } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ReactNode
}

function StatCard({ title, value, change, trend, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          <span
            className={
              trend === "up" ? "text-success" : "text-destructive"
            }
          >
            {change}
          </span>{" "}
          față de luna trecută
        </p>
      </CardContent>
    </Card>
  )
}

export function DashboardStats() {
  const stats = [
    {
      title: "Total Pacienți",
      value: "2,847",
      change: "+12.3%",
      trend: "up" as const,
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Programări Azi",
      value: "47",
      change: "+8.1%",
      trend: "up" as const,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      title: "Medici Activi",
      value: "18",
      change: "+2",
      trend: "up" as const,
      icon: <Stethoscope className="h-4 w-4" />,
    },
    {
      title: "Rata Prezență",
      value: "94.2%",
      change: "+2.4%",
      trend: "up" as const,
      icon: <Activity className="h-4 w-4" />,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
