"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Plus } from "lucide-react"
import { format } from "date-fns"
import { BookAppointmentDialog } from "@/components/dashboard/book-appointment-dialog"

interface Profile {
  id: string
  email: string
  full_name: string
  role: "student" | "lecturer"
  department: string | null
}

interface Appointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  subject: string
  description: string | null
  status: "pending" | "confirmed" | "cancelled" | "completed"
  lecturer: {
    id: string
    full_name: string
    department: string | null
  }
}

export function StudentDashboard({ profile }: { profile: Profile }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        lecturer:profiles!appointments_lecturer_id_fkey(id, full_name, department)
      `)
      .eq("student_id", profile.id)
      .order("appointment_date", { ascending: true })

    if (data) {
      setAppointments(data as Appointment[])
    }
    setIsLoading(false)
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  )
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile.full_name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Manage your appointments with lecturers</p>
        </div>
        <Button onClick={() => setBookingOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Upcoming"
          value={upcomingAppointments.length}
          description="Scheduled appointments"
        />
        <StatCard
          title="Pending"
          value={appointments.filter((a) => a.status === "pending").length}
          description="Awaiting confirmation"
        />
        <StatCard
          title="Completed"
          value={appointments.filter((a) => a.status === "completed").length}
          description="Past appointments"
        />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading appointments...
              </CardContent>
            </Card>
          ) : upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Button className="mt-4" onClick={() => setBookingOpen(true)}>
                  Book your first appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No past appointments
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BookAppointmentDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        studentId={profile.id}
        onSuccess={fetchAppointments}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string
  value: number
  description: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{appointment.subject}</h3>
              <Badge className={statusColors[appointment.status]} variant="secondary">
                {appointment.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {appointment.lecturer.full_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(appointment.appointment_date), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
              </span>
            </div>
            {appointment.description && (
              <p className="text-sm text-muted-foreground">{appointment.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
