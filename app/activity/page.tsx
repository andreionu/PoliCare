"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"

export default function ActivityPage() {
  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Activitate</h1>
            <p className="text-muted-foreground">Monitorizează activitatea din sistem</p>
          </div>

          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Pagina Activitate - În dezvoltare</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
