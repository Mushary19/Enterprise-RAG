import { QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "react-hot-toast"
import { BrowserRouter } from "react-router-dom"

import { AppRoutes } from "./App.tsx"
import { AuthProvider } from "./context/AuthContext"
import "./index.css"
import { queryClient } from "./lib/queryClient"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>

        <Toaster />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
