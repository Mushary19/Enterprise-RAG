import { Sparkles } from "lucide-react"
import type { ReactNode } from "react"

interface AuthShellProps {
  title: string
  subtitle: string
  footerText: string
  footerLink: string
  onFooterClick?: () => void
  children: ReactNode
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
      <div className="hidden lg:flex w-1/2 bg-zinc-900 border-r border-zinc-800">
        <div className="flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-semibold text-zinc-100 text-lg">AI Workspace</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-zinc-100 leading-tight mb-4">
              Your intelligent
              <br />
              knowledge companion.
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-md">
              Upload documents, chat with context, and let AI help you find answers
              across your knowledge base.
            </p>
          </div>
          <div className="flex items-center gap-6 text-zinc-500 text-sm">
            <span>Context-aware chat</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Document uploads</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Markdown rendering</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-semibold text-zinc-100 text-lg">AI Workspace</span>
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
