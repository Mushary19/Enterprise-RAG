import { ArrowRight, Lock, Mail } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { useAuth } from "../context/AuthContext"
import { AuthField } from "./AuthField"
import { AuthShell } from "./AuthShell"

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate("/app")
    } catch {
      setError("Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  const goToRegister = () => {
    navigate("/register")
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your AI workspace"
      footerText="Don't have an account?"
      footerLink="Sign up"
      onFooterClick={goToRegister}
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
          placeholder="Password"
          value={password}
          onChange={setPassword}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" isLoading={loading} className="w-full" size="lg">
          {!loading && (
            <>
              Sign in <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
