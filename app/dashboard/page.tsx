import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { LecturerDashboard } from "@/components/dashboard/lecturer-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        {profile.role === "student" ? (
          <StudentDashboard profile={profile} />
        ) : (
          <LecturerDashboard profile={profile} />
        )}
      </main>
    </div>
  )
}
