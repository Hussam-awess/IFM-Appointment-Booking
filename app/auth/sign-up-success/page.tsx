import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MailCheck } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="mt-2">
              {"We've sent you a confirmation link. Please check your email to verify your account."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
