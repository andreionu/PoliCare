"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Loader2, Eye } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"

interface Document {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PatientDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/patient/documents")
      .then((r) => r.json())
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (docId: string, docName: string) => {
    setDownloading(docId)
    try {
      const res = await fetch(`/api/documents/${docId}/url`)
      const data = await res.json()
      if (data.url) {
        const a = document.createElement("a")
        a.href = data.url
        a.download = docName
        a.target = "_blank"
        a.click()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Documentele Mele</h1>
        <p className="text-muted-foreground">{documents.length} documente</p>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="font-semibold text-sm">Niciun document disponibil</p>
            <p className="text-xs text-center max-w-xs">Documentele medicale încărcate de clinică vor apărea aici.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(doc.size)} · {format(new Date(doc.createdAt), "d MMM yyyy", { locale: ro })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/patient/documents/${doc.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => handleDownload(doc.id, doc.name)}
                    disabled={downloading === doc.id}
                  >
                    {downloading === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  )
}
