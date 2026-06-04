"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Download, Loader2, FileText, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"

// Inline rendered content for each mock document (by name keyword)
function MockDocumentContent({ name, patientName }: { name: string; patientName?: string }) {
  const today = format(new Date(), "dd.MM.yyyy", { locale: ro })
  const patient = patientName ?? "Alexandru Dima"

  if (name.toLowerCase().includes("analize") || name.toLowerCase().includes("sânge") || name.toLowerCase().includes("sange")) {
    return (
      <div className="p-8 max-w-2xl mx-auto font-mono text-sm space-y-6">
        <div className="text-center border-b pb-4">
          <p className="font-black text-lg">POLICARE — LABORATOR ANALIZE MEDICALE</p>
          <p className="text-muted-foreground text-xs">Str. Exemplu nr. 1, București · Tel: +40 123 456 789</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="font-bold">Pacient:</span> {patient}</div>
          <div><span className="font-bold">Data recoltării:</span> {today}</div>
          <div><span className="font-bold">CNP:</span> 1920420214567</div>
          <div><span className="font-bold">Medic solicitant:</span> Dr. D. Stoica</div>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1.5 font-bold">Parametru</th>
              <th className="text-right py-1.5 font-bold">Rezultat</th>
              <th className="text-right py-1.5 font-bold">Unitate</th>
              <th className="text-right py-1.5 font-bold">Valori normale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              ["Hemoglobina",     "14.2",  "g/dL",    "13.5 – 17.5"],
              ["Hematocrit",      "42.1",  "%",        "41.0 – 53.0"],
              ["Eritrocite",      "4.85",  "mil/mm³", "4.50 – 5.90"],
              ["Leucocite",       "6800",  "/mm³",    "4000 – 10000"],
              ["Neutrofile",      "58.2",  "%",        "50.0 – 70.0"],
              ["Limfocite",       "31.4",  "%",        "20.0 – 40.0"],
              ["Monocite",        "7.1",   "%",        "2.0 – 10.0"],
              ["Eozinofile",      "2.8",   "%",        "1.0 – 6.0"],
              ["Trombocite",      "245000","/mm³",    "150000 – 400000"],
              ["Glicemie",        "89",    "mg/dL",   "70 – 100"],
              ["Creatinina",      "0.92",  "mg/dL",   "0.70 – 1.20"],
              ["Uree",            "28",    "mg/dL",   "17 – 43"],
              ["ALAT (GPT)",      "22",    "U/L",     "< 41"],
              ["ASAT (GOT)",      "19",    "U/L",     "< 37"],
              ["Colesterol total","178",   "mg/dL",   "< 200"],
              ["HDL-Colesterol",  "52",    "mg/dL",   "> 40"],
              ["LDL-Colesterol",  "108",   "mg/dL",   "< 130"],
              ["Trigliceride",    "112",   "mg/dL",   "< 150"],
            ].map(([param, val, unit, ref]) => (
              <tr key={param}>
                <td className="py-1.5">{param}</td>
                <td className="text-right py-1.5 font-semibold">{val}</td>
                <td className="text-right py-1.5 text-muted-foreground">{unit}</td>
                <td className="text-right py-1.5 text-muted-foreground">{ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground border-t pt-4">Rezultatele sunt valabile 30 de zile de la data recoltării. Interpretarea se face de către medicul curant.</p>
      </div>
    )
  }

  if (name.toLowerCase().includes("ecografie")) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-sm space-y-5">
        <div className="text-center border-b pb-4">
          <p className="font-black text-lg">POLICARE — IMAGISTICĂ MEDICALĂ</p>
          <p className="text-muted-foreground text-xs">Str. Exemplu nr. 1, București · Tel: +40 123 456 789</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="font-bold">Pacient:</span> {patient}</div>
          <div><span className="font-bold">Data examinării:</span> {today}</div>
          <div><span className="font-bold">Tip examinare:</span> Ecografie abdominală</div>
          <div><span className="font-bold">Medic:</span> Dr. A. Radu</div>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold border-b pb-1">REZULTATE EXAMINARE</p>
          {[
            ["Ficat", "Dimensiuni normale, contur regulat, parenchim omogen, ecogenitate normală. Fără formațiuni focale vizibile. Vena portă cu flux normal."],
            ["Vezică biliară", "Distensionată, pereți subțiri, fără calculi sau polipi."],
            ["Splina", "Dimensiuni și structură normale. Lungime 10.2 cm."],
            ["Pancreas", "Vizualizat parțial, aspect normal în porțiunea cefalică."],
            ["Rinichi drept", "Dimensiuni: 10.8 x 5.1 cm. Parenchim uniform, fără dilatații pielocaliceale, fără calculi."],
            ["Rinichi stâng", "Dimensiuni: 11.0 x 5.3 cm. Aspect normal. Fără leziuni focale."],
            ["Aortă abdominală", "Calibru normal, fără anevrism."],
          ].map(([organ, desc]) => (
            <div key={organ}>
              <p className="font-semibold">{organ}</p>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 text-sm">
          <p className="font-bold">CONCLUZIE:</p>
          <p>Examinare ecografică abdominală în limite normale. Fără modificări patologice semnificative.</p>
        </div>
        <p className="text-xs text-muted-foreground">Medic imagist: Dr. A. Radu — Semnătură și parafă</p>
      </div>
    )
  }

  if (name.toLowerCase().includes("radiografie")) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-sm space-y-5">
        <div className="text-center border-b pb-4">
          <p className="font-black text-lg">POLICARE — RADIOLOGIE</p>
          <p className="text-muted-foreground text-xs">Str. Exemplu nr. 1, București · Tel: +40 123 456 789</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="font-bold">Pacient:</span> {patient}</div>
          <div><span className="font-bold">Data:</span> {today}</div>
          <div><span className="font-bold">Examinare:</span> Radiografie torace față și profil</div>
          <div><span className="font-bold">Indicație:</span> Screening respirator</div>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold border-b pb-1">INTERPRETARE RADIOLOGICĂ</p>
          {[
            ["Câmpuri pulmonare", "Transparență normală bilateral. Fără opacități sau hipertransparențe patologice. Desen bronhovascular normal."],
            ["Cord", "Siluetă cardiacă în limite normale. Indice cardiotoracic 0.48. Arcuri vasculare normale."],
            ["Mediastin", "Lărgime normală. Fără adenopatii hilare vizibile."],
            ["Pleură", "Sinusuri costofrenice libere bilateral. Fără revărsat pleural."],
            ["Diafragm", "Cupole diafragmatice la nivel normal, contur regulat."],
            ["Oase și țesuturi moi", "Fără leziuni osoase evidente. Grilaj costal intact."],
          ].map(([region, desc]) => (
            <div key={region}>
              <p className="font-semibold">{region}</p>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3">
          <p className="font-bold">CONCLUZIE:</p>
          <p>Aspect radiologic toraco-pulmonar normal. Fără modificări acute sau cronice vizibile.</p>
        </div>
        <p className="text-xs text-muted-foreground">Medic radiolog: Dr. M. Popescu — Semnătură și parafă</p>
      </div>
    )
  }

  if (name.toLowerCase().includes("scrisoare")) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-sm space-y-5">
        <div className="text-center border-b pb-4">
          <p className="font-black text-lg">POLICARE</p>
          <p className="text-muted-foreground text-xs">Str. Exemplu nr. 1, București · Tel: +40 123 456 789</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">București, {today}</div>
        <div className="space-y-1 text-sm">
          <p className="font-bold">Către: Medicul de familie al pacientului</p>
        </div>
        <div className="space-y-4 text-sm">
          <p><span className="font-bold">Ref:</span> Scrisoare medicală — {patient}</p>
          <p>
            Vă informăm că pacientul <strong>{patient}</strong>, CNP 1920420214567, în vârstă de 32 ani, a fost evaluat în
            cadrul Clinicii Policare în data de {today}, de către Dr. Daniela Stoica, specialist neurologie.
          </p>
          <p>
            Pacientul s-a prezentat cu acuze de cefalee recurentă cu caracter pulsatil, predominant hemicraniene,
            însoțite de fotofobie și greață, cu durata de 4-18 ore. Frecvența episoadelor: 2-3/lună.
          </p>
          <p>
            <span className="font-bold">Examen neurologic:</span> Fără semne de focar neurologic. Reflexe osteotendinoase
            prezente și simetrice. Mersul și echilibrul în limite normale.
          </p>
          <p>
            <span className="font-bold">Diagnostic stabilit:</span> Migrenă fără aură (G43.0) — forma episodică.
          </p>
          <p>
            <span className="font-bold">Tratament recomandat:</span> Sumatriptan 50mg la debut criză + Topiramat 25mg/zi
            profilactic timp de 3 luni. Recomandăm ținerea unui jurnal al crizelor.
          </p>
          <p>Vă rugăm să continuați monitorizarea pacientului și să ne contactați pentru orice nelămurire.</p>
        </div>
        <div className="border-t pt-4 text-sm">
          <p className="font-bold">Dr. Daniela Stoica</p>
          <p className="text-muted-foreground">Medic Primar Neurologie</p>
          <p className="text-muted-foreground">Clinica Policare — Neurologie</p>
        </div>
      </div>
    )
  }

  if (name.toLowerCase().includes("buletin") || name.toLowerCase().includes("identitate")) {
    return (
      <div className="p-8 max-w-sm mx-auto">
        <div className="border-2 border-slate-800 rounded-lg overflow-hidden text-sm">
          <div className="bg-slate-800 text-white text-center py-2 text-xs font-black tracking-widest">
            CARTE DE IDENTITATE
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-4">
              <div className="w-24 h-28 bg-slate-100 rounded flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
              <div className="space-y-1.5 text-xs">
                <div><span className="text-muted-foreground">Nume:</span> <span className="font-bold">DIMA</span></div>
                <div><span className="text-muted-foreground">Prenume:</span> <span className="font-bold">ALEXANDRU</span></div>
                <div><span className="text-muted-foreground">CNP:</span> <span className="font-mono">1920420214567</span></div>
                <div><span className="text-muted-foreground">Naționalitate:</span> ROMÂNĂ</div>
                <div><span className="text-muted-foreground">Data nașterii:</span> 20.04.1992</div>
                <div><span className="text-muted-foreground">Loc naștere:</span> Cluj-Napoca</div>
                <div><span className="text-muted-foreground">Domiciliu:</span> Bd. Unirii nr. 8, Cluj-Napoca</div>
                <div><span className="text-muted-foreground">Valabilitate:</span> 20.04.2034</div>
              </div>
            </div>
            <div className="border-t pt-2 text-[9px] font-mono text-muted-foreground tracking-wider">
              IDROU&lt;&lt;DIMA&lt;&lt;ALEXANDRU&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
            </div>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-3">Copie conformă cu originalul</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground p-8 text-center">
      <FileText className="h-10 w-10 opacity-40" />
      <p className="font-semibold">Previzualizare indisponibilă</p>
      <p className="text-sm">Descărcați documentul pentru a-l vizualiza.</p>
    </div>
  )
}

export default function PatientDocumentViewerPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params.id as string

  const [sasUrl, setSasUrl] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)
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
      .then((data) => { setSasUrl(data.url); setIsMock(!!data.mock) })
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
      </div>

      {/* Viewer */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden flex-1 flex items-start justify-center min-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center w-full h-48">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-destructive p-8 text-center">
            <AlertCircle className="h-10 w-10" />
            <p className="font-bold">{error}</p>
          </div>
        ) : isMock ? (
          <MockDocumentContent name={docName} />
        ) : sasUrl && docType === "application/pdf" ? (
          <iframe
            src={sasUrl}
            className="w-full"
            style={{ height: "max(300px, calc(100vh - 180px))" }}
            title={docName}
          />
        ) : sasUrl && docType?.startsWith("image/") ? (
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
          </div>
        )}
      </Card>
    </main>
  )
}
