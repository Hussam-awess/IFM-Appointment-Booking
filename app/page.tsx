import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image 
                src="/IFM logo.jpg" 
                alt="IFM Logo" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
            </div>
            <span className="font-semibold text-lg">IFM Appointments</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Book appointments with your lecturers, effortlessly
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              The IFM Student-Lecturer Appointment System makes it easy to schedule 
              consultations, get academic guidance, and connect with faculty members.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Create an account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-card border-y">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-12">
              Everything you need to manage appointments
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={Calendar}
                title="Easy Scheduling"
                description="Browse lecturer availability and book appointments that fit your schedule."
              />
              <FeatureCard
                icon={Clock}
                title="Real-time Updates"
                description="Get instant notifications when appointments are confirmed or rescheduled."
              />
              <FeatureCard
                icon={Users}
                title="For Everyone"
                description="Whether you're a student or lecturer, our system adapts to your needs."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-muted-foreground">
              Join the IFM Appointment System today and streamline your academic consultations.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/auth/sign-up">Create your account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Institute of Finance Management - Student-Lecturer Appointment System</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
