import { Navigate, Route, Routes } from "react-router-dom"
import Workspace from "./components/Workspace"
import { useAuth } from "./context/AuthContext"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
