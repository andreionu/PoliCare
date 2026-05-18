"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Download, Loader2, FileText, AlertCircle } from "lucide-react"

export default function PatientDocumentViewerPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params.id as string

  const [sasUrl, setSasUrl] = useState<string | null>(null)
  const [docName, setDocName] = useState("")
  const [docType, setDocType] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/patient/documents")
      .then((r) => r.json())
      .then((docs) => {
        const doc = Array.isArray(docs) ? docs.find((d: any) => d.id === docId) : null
        if (doc) { setDocName(doc.name); setDocType(doc.type) }
      })
      .catch(console.error)

    fetch(`/api/documents/${docId}/url`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Nu aveți acces la acest document.")
        return r.json()
      })
      .then((data) => setSasUrl(data.url))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [docId])

  const handleDownload = () => {
    if (!sasUrl) return
    const a = document.createElement("a")
    a.href = sasUrl
    a.download = docName
    a.target = "_blank"
    a.click()
  }

  return (
    <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl h-9 px-3 shrink-0">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Înapoi
        </Button>
        {docName && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-teal-600 shrink-0" />
            <h1 className="font-black text-base text-foreground truncate">{docName}</h1>
          </div>
        )}
        {sasUrl && (
          <Button onClick={handleDownload} className="rounded-xl h-9 bg-teal-600 hover:bg-teal-700 shrink-0 ml-auto">
            <Download className="h-4 w-4 mr-1.5" />
            Descarcă
          </Button>
        )}
      </div>

      {/* Viewer */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden flex-1 flex items-center justify-center min-h-[300px]">
        {loading ? (
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-destructive p-8 text-center">
            <AlertCircle className="h-10 w-10" />
            <p className="font-bold">{error}</p>
          </div>
        ) : sasUrl && docType === "application/pdf" ? (
          <iframe
            src={sasUrl}
            className="w-full"
            style={{ height: "max(300px, calc(100vh - 180px))" }}
            title={docName}
          />
        ) : sasUrl && (docType === "image/jpeg" || docType === "image/png" || docType?.startsWith("image/")) ? (
          <img
            src={sasUrl}
            alt={docName}
            className="max-w-full object-contain p-4"
            style={{ maxHeight: "max(300px, calc(100vh - 200px))" }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-8 text-center">
            <FileText className="h-10 w-10 opacity-40" />
            <p className="font-semibold">Previzualizare indisponibilă</p>
            <p className="text-sm">Descărcați documentul pentru a-l vizualiza.</p>
            {sasUrl && (
              <Button onClick={handleDownload} className="mt-2 rounded-xl bg-teal-600 hover:bg-teal-700">
                <Download className="h-4 w-4 mr-2" /> Descarcă
              </Button>
            )}
          </div>
        )}
      </Card>
    </main>
  )
}
