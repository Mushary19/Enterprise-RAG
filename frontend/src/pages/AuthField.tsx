import type { ReactNode } from "react"
import { Input } from "../components/ui/Input"

interface AuthFieldProps {
  icon: ReactNode
  type: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function AuthField({ icon, type, placeholder, value, onChange }: AuthFieldProps) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
        {icon}
      </span>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 pl-10"
      />
    </div>
  )
}
