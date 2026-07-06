import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import { Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  isPending: boolean;
}

export function ChatInput({ onSend, isPending }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isPending) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-zinc-800 bg-slate-900/80 backdrop-blur-sm px-3 py-3 md:px-6 md:py-4">
      <div className="flex items-end gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-3 py-2.5 md:px-4 md:py-3 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
        <button
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-all duration-200"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none text-sm leading-relaxed"
          disabled={isPending}
        />

        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isPending}
          className="flex-shrink-0 p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:shadow-none"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-zinc-500 text-center mt-2">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
