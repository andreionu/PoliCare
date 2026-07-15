"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { formatDoctorName } from "@/lib/utils"

interface Medication {
  name: string
  concentration: string
  quantity: string
  dosage: string
  duration: string
}

interface PrescriptionData {
  id: string
  number: string
  diagnosis: string
  medications: Medication[]
  notes?: string | null
  signatureData?: string | null
  status: string
  createdAt: string
  doctor: { name: string; specialty: string; department: { name: string } }
  patient: { name: string; cnp?: string | null; birthDate?: string | null }
}

interface PrescriptionPrintProps {
  prescription: PrescriptionData
}

interface ClinicSettings {
  clinicName: string
  clinicAddress?: string | null
  clinicPhone?: string | null
}

export function PrescriptionPrint({ prescription }: PrescriptionPrintProps) {
  const [settings, setSettings] = useState<ClinicSettings>({ clinicName: "PoliCare" })

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => {})
  }, [])

  const date = format(new Date(prescription.createdAt), "dd.MM.yyyy", { locale: ro })
  const medications = prescription.medications as Medication[]

  const patientAge = (() => {
    if (!prescription.patient.birthDate) return null
    const today = new Date()
    const birth = new Date(prescription.patient.birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  })()

  return (
    <div>
      {/* Print button — hidden when printing */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Printează Rețeta
        </Button>
      </div>

      {/* Printable area */}
      <div
        id="prescription-print-area"
        className="font-serif text-sm text-gray-900 border border-gray-300 rounded-lg overflow-hidden print:border-none print:rounded-none"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Clinic header */}
        <div className="bg-teal-700 text-white px-4 sm:px-6 py-3 sm:py-4 print:bg-teal-700 print:text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xl font-bold tracking-wide">{settings.clinicName}</p>
              {settings.clinicAddress && (
                <p className="text-teal-100 text-xs mt-0.5">{settings.clinicAddress}</p>
              )}
              {settings.clinicPhone && (
                <p className="text-teal-100 text-xs">{settings.clinicPhone}</p>
              )}
            </div>
            <div className="text-right text-xs text-teal-100">
              <p className="text-base font-bold text-white">REȚETĂ MEDICALĂ</p>
              <p>Nr. {prescription.number}</p>
              <p>Data: {date}</p>
            </div>
          </div>
        </div>

        {/* Doctor + Patient info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-gray-200 divide-y sm:divide-y-0">
          <div className="px-6 py-4 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Medic</p>
            <p className="font-bold text-gray-800">{formatDoctorName(prescription.doctor.name)}</p>
            <p className="text-gray-600 text-xs">{prescription.doctor.specialty}</p>
            <p className="text-gray-500 text-xs">{prescription.doctor.department.name}</p>
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Pacient</p>
            <p className="font-bold text-gray-800">{prescription.patient.name}</p>
            {prescription.patient.cnp && (
              <p className="text-gray-600 text-xs">CNP: {prescription.patient.cnp}</p>
            )}
            {patientAge !== null && (
              <p className="text-gray-500 text-xs">Vârstă: {patientAge} ani</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Diagnosis */}
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Diagnostic</p>
          <p className="text-gray-800 font-semibold">{prescription.diagnosis}</p>
        </div>

        <div className="border-t border-gray-200" />

        {/* Medications */}
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Rx — Medicamente</p>
          <ol className="space-y-3">
            {medications.map((med, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-bold text-teal-700 shrink-0 w-5">{i + 1}.</span>
                <div>
                  <p className="font-bold text-gray-800">
                    {med.name}
                    {med.concentration && (
                      <span className="font-normal text-gray-600"> — {med.concentration}</span>
                    )}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {[med.quantity, med.dosage, med.duration].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        {prescription.notes && (
          <>
            <div className="border-t border-gray-200" />
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Indicații</p>
              <p className="text-gray-700 text-sm italic">{prescription.notes}</p>
            </div>
          </>
        )}

        {/* Signature area */}
        <div className="border-t border-gray-200 px-6 py-6 flex justify-end">
          <div className="text-center">
            {prescription.signatureData ? (
              <img
                src={prescription.signatureData}
                alt="Semnătură medic"
                className="h-12 sm:h-16 w-36 sm:w-44 object-contain mb-1"
              />
            ) : (
              <div className="border-b border-gray-400 w-36 sm:w-44 mb-1 h-12 sm:h-16" />
            )}
            <p className="text-xs text-gray-500">Semnătura și parafa medicului</p>
          </div>
        </div>
      </div>

      {/* Global print styles */}
      <style>{`
        @media print {
          body > *:not(#prescription-print-area) { display: none !important; }
          #prescription-print-area { border: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
