import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Appointment {
  id: string
  patient: string
  doctor: string
  time: string
  department: string
  status: "confirmed" | "pending" | "completed"
}

const appointments: Appointment[] = [
  {
    id: "1",
    patient: "Maria Popescu",
    doctor: "Dr. Ion Ionescu",
    time: "10:30",
    department: "Cardiologie",
    status: "confirmed",
  },
  {
    id: "2",
    patient: "Andrei Munteanu",
    doctor: "Dr. Elena Radu",
    time: "11:00",
    department: "ORL",
    status: "pending",
  },
  {
    id: "3",
    patient: "Ana Dumitru",
    doctor: "Dr. Mihai Stan",
    time: "11:30",
    department: "Oftalmologie",
    status: "confirmed",
  },
  {
    id: "4",
    patient: "Vasile Matei",
    doctor: "Dr. Ion Ionescu",
    time: "12:00",
    department: "Cardiologie",
    status: "completed",
  },
  {
    id: "5",
    patient: "Diana Gheorghe",
    doctor: "Dr. Laura Popa",
    time: "14:00",
    department: "Dermatologie",
    status: "confirmed",
  },
]

const statusConfig = {
  confirmed: { label: "Confirmat", className: "bg-success/10 text-success" },
  pending: { label: "În așteptare", className: "bg-warning/10 text-warning" },
  completed: { label: "Finalizat", className: "bg-muted text-muted-foreground" },
}

export function RecentAppointments() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programări Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {appointment.patient
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {appointment.patient}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.doctor} • {appointment.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium tabular-nums">
                  {appointment.time}
                </div>
                <Badge
                  variant="outline"
                  className={statusConfig[appointment.status].className}
                >
                  {statusConfig[appointment.status].label}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
