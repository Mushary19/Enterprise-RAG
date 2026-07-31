import { Toaster } from "react-hot-toast"

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#18181b",
          color: "#f4f4f5",
          border: "1px solid #27272a",
          borderRadius: "1rem",
          fontSize: "0.875rem",
          padding: "0.75rem 1rem",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3)",
        },
        success: {
          iconTheme: { primary: "#34d399", secondary: "#18181b" },
        },
        error: {
          iconTheme: { primary: "#f87171", secondary: "#18181b" },
        },
      }}
    />
  )
}
