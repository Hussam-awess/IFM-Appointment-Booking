"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Loader2 } from "lucide-react"
import { format, addDays, getDay } from "date-fns"

interface Lecturer {
  id: string
  full_name: string
  department: string | null
}

interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface BookAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  onSuccess: () => void
}

export function BookAppointmentDialog({
  open,
  onOpenChange,
  studentId,
  onSuccess,
}: BookAppointmentDialogProps) {
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [selectedLecturer, setSelectedLecturer] = useState<string>("")
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchLecturers()
    }
  }, [open])

  useEffect(() => {
    if (selectedLecturer) {
      fetchAvailability(selectedLecturer)
      setSelectedDate(undefined)
      setSelectedSlot("")
    }
  }, [selectedLecturer])

  async function fetchLecturers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("role", "lecturer")
      .order("full_name")

    if (data) {
      setLecturers(data)
    }
  }

  async function fetchAvailability(lecturerId: string) {
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("lecturer_id", lecturerId)
      .eq("is_active", true)

    if (data) {
      setAvailability(data)
    }
  }

  function isDateAvailable(date: Date): boolean {
    const dayOfWeek = getDay(date)
    return availability.some((slot) => slot.day_of_week === dayOfWeek)
  }

  function getAvailableSlotsForDate(date: Date): AvailabilitySlot[] {
    const dayOfWeek = getDay(date)
    return availability.filter((slot) => slot.day_of_week === dayOfWeek)
  }

  async function handleSubmit() {
    if (!selectedLecturer || !selectedDate || !selectedSlot || !subject) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError(null)

    const slot = availability.find((s) => s.id === selectedSlot)
    if (!slot) return

    const { error: insertError } = await supabase.from("appointments").insert({
      student_id: studentId,
      lecturer_id: selectedLecturer,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: slot.start_time,
      end_time: slot.end_time,
      subject,
      description: description || null,
      status: "pending",
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    // Create notification for lecturer
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", studentId)
      .single()

    await supabase.from("notifications").insert({
      user_id: selectedLecturer,
      title: "New Appointment Request",
      message: `${studentProfile?.full_name || "A student"} has requested an appointment for ${format(selectedDate, "MMM d, yyyy")} regarding "${subject}"`,
    })

    setIsLoading(false)
    onOpenChange(false)
    resetForm()
    onSuccess()
  }

  function resetForm() {
    setSelectedLecturer("")
    setSelectedDate(undefined)
    setSelectedSlot("")
    setSubject("")
    setDescription("")
    setError(null)
  }

  const availableSlotsForSelectedDate = selectedDate
    ? getAvailableSlotsForDate(selectedDate)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Select a lecturer and choose an available time slot
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Select Lecturer</Label>
            <Select value={selectedLecturer} onValueChange={setSelectedLecturer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a lecturer" />
              </SelectTrigger>
              <SelectContent>
                {lecturers.map((lecturer) => (
                  <SelectItem key={lecturer.id} value={lecturer.id}>
                    {lecturer.full_name}
                    {lecturer.department && ` - ${lecturer.department}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLecturer && (
            <>
              <div className="space-y-2">
                <Label>Select Date</Label>
                {availability.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This lecturer has not set any availability yet.
                  </p>
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date() ||
                      date > addDays(new Date(), 30) ||
                      !isDateAvailable(date)
                    }
                    className="rounded-md border"
                  />
                )}
              </div>

              {selectedDate && availableSlotsForSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlotsForSelectedDate.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedSlot && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Project discussion, Grade inquiry"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Additional Details (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Any additional information..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedLecturer || !selectedDate || !selectedSlot || !subject || isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
