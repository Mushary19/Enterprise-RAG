import { ArrowRight, Loader2, Lock, Mail, Sparkles } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRegisterUser } from "../hooks/useAuth"

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

export function RegisterPage() {
  const { mutate: registerUser } = useRegisterUser()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || password.length < 6) {
      setError(
        "Please fill all fields. Password must be at least 6 characters.",
      )
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
        {/* <Field
          icon={<User className="w-4 h-4" />}
          type="text"
          placeholder="Full name"
          value={name}
          onChange={setName}
        /> */}
        <Field
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={setEmail}
        />
        <Field
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={setPassword}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Create account <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}

interface FieldProps {
  icon: React.ReactNode
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}

function Field({ icon, type, placeholder, value, onChange }: FieldProps) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
      />
    </div>
  )
}

interface AuthShellProps {
  title: string
  subtitle: string
  footerText: string
  footerLink: string
  onFooterClick?: () => void
  children: React.ReactNode
}

export function AuthShell({
  title,
  subtitle,
  footerText,
  footerLink,
  onFooterClick,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-950 to-blue-950/40 border-r border-zinc-800">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-zinc-100 text-lg">
              AI Workspace
            </span>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-zinc-100 leading-tight mb-4">
              Your intelligent
              <br />
              knowledge companion.
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              Upload documents, chat with context, and let AI help you find
              answers across your knowledge base.
            </p>
          </div>
          <div className="flex items-center gap-6 text-zinc-500 text-sm">
            <span>Context-aware chat</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span>Document uploads</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span>Markdown rendering</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-zinc-100 text-lg">
              AI Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">{title}</h1>
          <p className="text-zinc-500 mb-8">{subtitle}</p>
          {children}
          <p className="text-center text-sm text-zinc-500 mt-6">
            {footerText}{" "}
            <button
              onClick={onFooterClick}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {footerLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
