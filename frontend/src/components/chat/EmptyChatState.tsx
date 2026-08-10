import { Sparkles } from "lucide-react"

const SUGGESTIONS = [
  "Summarize the key points from my uploaded documents",
  "What does the knowledge base say about this topic?",
  "Draft an outline based on the reference material",
  "Compare two documents I've uploaded",
]

interface EmptyChatStateProps {
  onSuggestionClick: (text: string) => void
}

export function EmptyChatState({ onSuggestionClick }: EmptyChatStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-1.5">
          Start a new conversation
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          Ask a question or upload a document to begin
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors duration-150"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
