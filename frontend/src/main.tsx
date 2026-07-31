import { QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "framer-motion"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { AppRoutes } from "./App.tsx"
import { AppToaster } from "./components/ui/Toaster"
import { TooltipProvider } from "./components/ui/Tooltip"
import { AuthProvider } from "./context/AuthContext"
import "./index.css"
import { queryClient } from "./lib/queryClient"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={300}>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>

            <AppToaster />
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)
