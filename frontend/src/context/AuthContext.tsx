import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export interface AuthUser {
  email: string
  name: string
}
interface AuthState {
  accessToken: string | null
  user: AuthUser | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const STORAGE_KEY = "auth_token"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setToken(stored)
      fetchMe(stored)
    }
  }, [])

  const fetchMe = async (jwt: string) => {
    try {
      const res = await fetch("http://localhost:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })

      if (!res.ok) throw new Error("Invalid token")

      const data = await res.json()
      setUser(data)
    } catch {
      logout()
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) throw new Error("Login failed")

    const data = await res.json()

    localStorage.setItem(STORAGE_KEY, data.access_token)
    setToken(data.access_token)

    // await fetchMe(data.access_token)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch("http://localhost:8000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) throw new Error("Register failed")

    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return ctx
}
