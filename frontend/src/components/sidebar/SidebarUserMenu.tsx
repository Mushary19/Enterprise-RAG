import { LogOut, Settings, User } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu"

interface SidebarUserMenuProps {
  collapsed: boolean
}

export function SidebarUserMenu({ collapsed }: SidebarUserMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const initial = user.email.charAt(0).toUpperCase()

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-1.5 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-200 text-sm font-semibold flex-shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-zinc-100 truncate">{user.name || user.email}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        <DropdownMenuItem disabled className="opacity-60 cursor-default">
          <User className="w-4 h-4" />
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="opacity-60 cursor-default">
          <Settings className="w-4 h-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem danger onSelect={logout}>
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
