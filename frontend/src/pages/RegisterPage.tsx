import { ArrowRight, Lock, Mail } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { useRegisterUser } from "../hooks/useAuth"
import { AuthField } from "./AuthField"
import { AuthShell } from "./AuthShell"

export function RegisterPage() {
  const { mutateAsync: registerUser } = useRegisterUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || password.length < 6) {
      setError("Please fill all fields. Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    try {
      await registerUser({ email: email.trim(), password })
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const goToLogin = () => {
    navigate("/login")
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building with your AI workspace"
      footerText="Already have an account?"
      footerLink="Sign in"
      onFooterClick={goToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={setEmail}
        />
        <AuthField
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={setPassword}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" isLoading={loading} className="w-full" size="lg">
          {!loading && (
            <>
              Create account <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
