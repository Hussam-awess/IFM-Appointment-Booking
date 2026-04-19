"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, CheckCircle, XCircle, MessageSquare } from "lucide-react"
import { format, parseISO, isToday, isTomorrow } from "date-fns"
import { ManageAvailabilityDialog } from "./manage-availability-dialog"

interface Appointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  subject: string
  description: string | null
  status: "pending" | "confirmed" | "cancelled" | "completed"
  lecturer_notes: string | null
  created_at: string
  student: {
    id: string
    full_name: string
    email: string
    department: string | null
  }
}

interface LecturerDashboardProps {
  profile: {
    id: string
    full_name: string
    email: string
    department: string | null
  }
}

export function LecturerDashboard({ profile }: LecturerDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        student:profiles!appointments_student_id_fkey(id, full_name, email, department)
      `)
      .eq("lecturer_id", profile.id)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (!error && data) {
      setAppointments(data as Appointment[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAppointments()
  }, [profile.id])

  const updateAppointmentStatus = async (appointmentId: string, status: "confirmed" | "cancelled" | "completed") => {
    setUpdating(appointmentId)
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)

    if (!error) {
      // Create notification for student
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        const statusMessages = {
          confirmed: `Your appointment with ${profile.full_name} has been confirmed`,
          cancelled: `Your appointment with ${profile.full_name} has been cancelled`,
          completed: `Your appointment with ${profile.full_name} has been marked as completed`
        }
        
        await supabase.from("notifications").insert({
          user_id: appointment.student.id,
          title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: statusMessages[status],
          appointment_id: appointmentId
        })
      }
      
      fetchAppointments()
    }
    setUpdating(null)
  }

  const pendingAppointments = appointments.filter(a => a.status === "pending")
  const upcomingAppointments = appointments.filter(a => a.status === "confirmed")
  const pastAppointments = appointments.filter(a => a.status === "completed" || a.status === "cancelled")

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEE, MMM d")
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      completed: { variant: "outline", label: "Completed" }
    }
    const { variant, label } = variants[status] || variants.pending
    return <Badge variant={variant}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Confirmed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastAppointments.filter(a => a.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">Total consultations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students Met</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(appointments.filter(a => a.status === "completed").map(a => a.student.id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique students</p>
          </CardContent>
        </Card>
      </div>

      {/* Manage Availability */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Availability Schedule</CardTitle>
            <CardDescription>Set your weekly availability for student appointments</CardDescription>
          </div>
          <ManageAvailabilityDialog lecturerId={profile.id} onUpdate={fetchAppointments} />
        </CardHeader>
      </Card>

      {/* Appointments Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingAppointments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg">All caught up!</h3>
                <p className="text-muted-foreground">No pending appointment requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingAppointments.map(appointment => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{appointment.subject}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateLabel(appointment.appointment_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.student.full_name}</span>
                        <span className="text-muted-foreground">({appointment.student.email})</span>
                      </div>
                      {appointment.description && (
                        <div className="flex items-start gap-2 text-sm mt-2 p-3 bg-muted rounded-lg">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p>{appointment.description}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                        disabled={updating === appointment.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
                        disabled={updating === appointment.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg">No upcoming appointments</h3>
                <p className="text-muted-foreground">Confirmed appointments will appear here</p>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map(appointment => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{appointment.subject}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateLabel(appointment.appointment_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.student.full_name}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                      disabled={updating === appointment.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg">No past appointments</h3>
                <p className="text-muted-foreground">Your appointment history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map(appointment => (
              <Card key={appointment.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{appointment.subject}</h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(appointment.appointment_date), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.student.full_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
