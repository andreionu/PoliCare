"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Heart, Users, Baby, Eye, Ear, ChevronRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingWizardProps {
  onClose: () => void
}

const departments = [
  { id: 1, name: "Cardiologie", icon: Heart },
  { id: 2, name: "Pediatrie", icon: Baby },
  { id: 3, name: "ORL", icon: Ear },
  { id: 4, name: "Oftalmologie", icon: Eye },
  { id: 5, name: "Dermatologie", icon: Users },
]

const servicesByDepartment = {
  1: ["Consultație Generală", "EKG (Electrocardiogramă)", "Ecocardiogramă", "Monitorizare Holter"],
  2: ["Consultație Pediatrică", "Vaccinare", "Control Dezvoltare", "Consultație Nutriție Copii"],
  3: ["Consultație ORL", "Audiometrie", "Endoscopie Nazală", "Tratament Sinuzită"],
  4: ["Consultație Oftalmologică", "Control Vedere", "Tratament Glaucom", "Consultație Lentile de Contact"],
  5: ["Consultație Dermatologică", "Tratament Acnee", "Screening Cancer Piele", "Tratament Alergii Cutanate"],
}

const doctors = {
  1: [
    { id: 1, name: "Dr. Maria Popescu", avatar: "/female-doctor.png", rating: 4.9, specialty: "Cardiologie" },
    { id: 2, name: "Dr. Ion Ionescu", avatar: "/male-doctor.png", rating: 4.8, specialty: "Cardiologie" },
  ],
  2: [
    { id: 3, name: "Dr. Ana Marinescu", avatar: "/female-doctor-2.jpg", rating: 4.9, specialty: "Pediatrie" },
    { id: 4, name: "Dr. Mihai Gheorghe", avatar: "/male-doctor-2.jpg", rating: 4.7, specialty: "Pediatrie" },
  ],
  3: [{ id: 5, name: "Dr. Elena Dumitrescu", avatar: "/female-doctor-3.jpg", rating: 4.8, specialty: "ORL" }],
  4: [{ id: 6, name: "Dr. Alexandru Stan", avatar: "/male-doctor-3.jpg", rating: 4.9, specialty: "Oftalmologie" }],
  5: [{ id: 7, name: "Dr. Carmen Vasile", avatar: "/female-doctor.png", rating: 4.7, specialty: "Dermatologie" }],
}

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
]

export function BookingWizard({ onClose }: BookingWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [selectedService, setSelectedService] = useState<string>("")
  const [otherServiceDescription, setOtherServiceDescription] = useState<string>("")
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, "")
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9+\s()-]{10,20}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = () => {
    const sanitizedName = sanitizeInput(formData.name)
    const sanitizedEmail = sanitizeInput(formData.email.toLowerCase())
    const sanitizedPhone = sanitizeInput(formData.phone)

    if (!sanitizedName || sanitizedName.length < 2) {
      alert("Please enter a valid name (at least 2 characters)")
      return
    }

    if (!validateEmail(sanitizedEmail)) {
      alert("Please enter a valid email address")
      return
    }

    if (!validatePhone(sanitizedPhone)) {
      alert("Please enter a valid phone number")
      return
    }

    // In production, send sanitized data to backend
    console.log("Booking data:", {
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      department: selectedDepartment,
      service: selectedService === "Altul / Nu este listat" ? sanitizeInput(otherServiceDescription) : selectedService,
      doctor: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
    })

    setIsSubmitted(true)
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedDepartment !== null
      case 2:
        if (selectedService === "Altul / Nu este listat") {
          return otherServiceDescription.trim() !== ""
        }
        return selectedService !== ""
      case 3:
        return selectedDoctor !== null
      case 4:
        return selectedDate !== "" && selectedTime !== ""
      case 5:
        return formData.name && formData.phone && formData.email
      default:
        return false
    }
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Programare Confirmată!</h3>
            <p className="text-muted-foreground">Vei primi un email de confirmare în curând. Te așteptăm!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Programează-te</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, label: "Departament" },
              { num: 2, label: "Serviciu" },
              { num: 3, label: "Medic" },
              { num: 4, label: "Dată & Oră" },
              { num: 5, label: "Detalii" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                      step >= s.num ? "bg-primary text-white" : "bg-gray-200 text-gray-400",
                    )}
                  >
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span className="text-xs mt-2 font-medium hidden sm:block text-center whitespace-nowrap">
                    {s.label}
                  </span>
                </div>
                {i < 4 && (
                  <div
                    className={cn(
                      "h-1 flex-1 mx-2 transition-all duration-300",
                      step > s.num ? "bg-primary" : "bg-gray-200",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {/* Step 1: Select Department */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Alege Departamentul</h3>
                <p className="text-muted-foreground">Selectează specialitatea medicală de care ai nevoie</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg",
                      selectedDepartment === dept.id
                        ? "border-primary bg-blue-50"
                        : "border-gray-200 hover:border-primary/50",
                    )}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <dept.icon
                        className={cn("w-6 h-6", selectedDepartment === dept.id ? "text-primary" : "text-gray-600")}
                      />
                    </div>
                    <h4 className="font-semibold text-center">{dept.name}</h4>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedDepartment && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Alege Serviciul</h3>
                <p className="text-muted-foreground">Ce tip de consultație sau tratament necesiți?</p>
              </div>
              <div className="max-w-2xl mx-auto space-y-3">
                {servicesByDepartment[selectedDepartment as keyof typeof servicesByDepartment]?.map((service) => (
                  <button
                    key={service}
                    onClick={() => {
                      setSelectedService(service)
                      setOtherServiceDescription("")
                    }}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md text-left",
                      selectedService === service
                        ? "border-primary bg-blue-50"
                        : "border-gray-200 hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{service}</span>
                      {selectedService === service && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => setSelectedService("Altul / Nu este listat")}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md text-left",
                    selectedService === "Altul / Nu este listat"
                      ? "border-primary bg-blue-50"
                      : "border-gray-200 hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">Altul / Nu este listat</span>
                    {selectedService === "Altul / Nu este listat" && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    selectedService === "Altul / Nu este listat" ? "max-h-48 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="pt-3">
                    <Label htmlFor="otherDescription" className="mb-2 block text-sm font-medium">
                      Descrie nevoia sau simptomele tale *
                    </Label>
                    <Textarea
                      id="otherDescription"
                      placeholder="Ex: Am nevoie de o consultație pentru dureri de cap frecvente..."
                      value={otherServiceDescription}
                      onChange={(e) => setOtherServiceDescription(e.target.value)}
                      className={cn(
                        "min-h-[100px] resize-none transition-colors duration-200",
                        selectedService === "Altul / Nu este listat" && otherServiceDescription.trim() === ""
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "",
                      )}
                      required={selectedService === "Altul / Nu este listat"}
                    />
                    {selectedService === "Altul / Nu este listat" && otherServiceDescription.trim() === "" && (
                      <p className="text-sm text-red-500 mt-1">Acest câmp este obligatoriu</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && selectedDepartment && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Alege Medicul</h3>
                <p className="text-muted-foreground">Selectează specialistul preferat</p>
              </div>
              <div className="space-y-4 max-w-2xl mx-auto">
                {doctors[selectedDepartment as keyof typeof doctors]?.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    className={cn(
                      "w-full p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg flex items-center gap-4 text-left",
                      selectedDoctor === doctor.id
                        ? "border-primary bg-blue-50"
                        : "border-gray-200 hover:border-primary/50",
                    )}
                  >
                    <img
                      src={doctor.avatar || "/placeholder.svg"}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{doctor.name}</h4>
                      <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{doctor.rating}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Alege Data și Ora</h3>
                <p className="text-muted-foreground">Selectează momentul potrivit pentru consultație</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="relative">
                  <Label className="mb-3 block font-semibold">Selectează Data</Label>
                  <div className="relative z-10">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="h-12 w-full"
                      style={{
                        colorScheme: "light",
                      }}
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <Label className="mb-3 block font-semibold">Selectează Ora</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "p-3 rounded-xl border-2 font-medium transition-all duration-200 hover:scale-105",
                            selectedTime === time
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-primary/50",
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Detaliile Tale</h3>
                <p className="text-muted-foreground">Completează informațiile de contact</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-2 block">
                    Nume Complet
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Ion Popescu"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                    className="h-12"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2 block">
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: 0712345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: sanitizeInput(e.target.value) })}
                    className="h-12"
                    maxLength={20}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="mb-2 block">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: ion.popescu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: sanitizeInput(e.target.value) })}
                    className="h-12"
                    maxLength={254}
                    required
                  />
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl space-y-2">
                  <h4 className="font-semibold mb-3">Rezumat Programare</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Departament:</span>{" "}
                      <span className="font-medium">{departments.find((d) => d.id === selectedDepartment)?.name}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Serviciu:</span>{" "}
                      <span className="font-medium">
                        {selectedService === "Altul / Nu este listat" ? otherServiceDescription : selectedService}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Data:</span>{" "}
                      <span className="font-medium">{selectedDate}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Ora:</span>{" "}
                      <span className="font-medium">{selectedTime}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="px-6">
            Înapoi
          </Button>

          {step < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed()} className="px-8">
              Continuă
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()} className="px-8 bg-green-600 hover:bg-green-700">
              <Check className="mr-2 w-4 h-4" />
              Confirmă Programarea
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
