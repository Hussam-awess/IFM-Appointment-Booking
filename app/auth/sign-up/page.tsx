"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

const DEPARTMENTS = [
  "Accounting",
  "Banking and Finance",
  "Business Administration",
  "Computer Science",
  "Economics",
  "Insurance",
  "Marketing",
  "Procurement and Supply Chain Management",
  "Tax Management",
]

const YEARS_OF_STUDY = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
]

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"student" | "lecturer">("student")
  const [department, setDepartment] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Student-specific fields
  const [module, setModule] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [yearOfStudy, setYearOfStudy] = useState("")
  
  // Lecturer-specific fields
  const [subjectsTeaching, setSubjectsTeaching] = useState("")
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const metadata: Record<string, string | number> = {
      full_name: fullName,
      role: role,
      department: department,
    }

    // Add role-specific metadata
    if (role === "student") {
      metadata.module = module
      metadata.registration_number = registrationNumber
      metadata.year_of_study = parseInt(yearOfStudy) || 1
    } else {
      metadata.subjects_teaching = subjectsTeaching
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: metadata,
      },
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    if (authData.user) {
      router.push("/auth/sign-up-success")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50">
      <Card className="w-full max-w-md border-blue-100">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <Image 
              src="/IFM logo.jpg" 
              alt="IFM Logo" 
              width={64} 
              height={64}
              className="rounded-lg"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-blue-900">Create an account</CardTitle>
            <CardDescription className="mt-2">
              Join the IFM Appointment System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@ifm.ac.tz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>I am a</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as "student" | "lecturer")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" className="border-blue-400 text-blue-600" />
                  <Label htmlFor="student" className="font-normal cursor-pointer">
                    Student
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lecturer" id="lecturer" className="border-blue-400 text-blue-600" />
                  <Label htmlFor="lecturer" className="font-normal cursor-pointer">
                    Lecturer
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student-specific fields */}
            {role === "student" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    type="text"
                    placeholder="e.g., IFM/BBA/2023/001"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="module">Module / Program</Label>
                  <Input
                    id="module"
                    type="text"
                    placeholder="e.g., Bachelor of Business Administration"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearOfStudy">Year of Study</Label>
                  <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                    <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS_OF_STUDY.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Lecturer-specific fields */}
            {role === "lecturer" && (
              <div className="space-y-2">
                <Label htmlFor="subjectsTeaching">Subjects Teaching</Label>
                <Textarea
                  id="subjectsTeaching"
                  placeholder="List the subjects/courses you teach (e.g., Financial Accounting, Business Statistics, Corporate Finance)"
                  value={subjectsTeaching}
                  onChange={(e) => setSubjectsTeaching(e.target.value)}
                  required
                  rows={3}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
