import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Heart, Ear, Eye, Stethoscope, Baby } from 'lucide-react'

interface Department {
  name: string
  patients: number
  capacity: number
  percentage: number
  icon: React.ReactNode
}

const departments: Department[] = [
  { name: "Cardiologie", patients: 23, capacity: 30, percentage: 77, icon: <Heart className="h-5 w-5" /> },
  { name: "ORL", patients: 18, capacity: 25, percentage: 72, icon: <Ear className="h-5 w-5" /> },
  { name: "Oftalmologie", patients: 15, capacity: 20, percentage: 75, icon: <Eye className="h-5 w-5" /> },
  { name: "Dermatologie", patients: 12, capacity: 20, percentage: 60, icon: <Stethoscope className="h-5 w-5" /> },
  { name: "Pediatrie", patients: 28, capacity: 35, percentage: 80, icon: <Baby className="h-5 w-5" /> },
]

export function DepartmentsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ocupare Departamente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {departments.map((dept) => (
            <div key={dept.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
                    {dept.icon}
                  </div>
                  <span className="font-medium">{dept.name}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  {dept.patients}/{dept.capacity}
                </span>
              </div>
              <Progress value={dept.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
