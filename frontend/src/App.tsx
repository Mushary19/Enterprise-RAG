import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"

const AppShell = lazy(() => import("./components/layout/AppShell"))

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
      Loading...
    </div>
  )
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <FullScreenLoader />
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
            <Suspense fallback={<FullScreenLoader />}>
              <AppShell />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
