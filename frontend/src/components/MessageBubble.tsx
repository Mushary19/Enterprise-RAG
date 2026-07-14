import { User, Bot, Loader2 } from "lucide-react";
import type { ChatMessage } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isThinking = isStreaming && !message.content;

  return (
    <div
      className={`flex gap-2.5 w-full ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar — always fixed size, never shrinks */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-start mt-0.5 ${
          isUser ? "bg-blue-500" : "bg-zinc-800 border border-zinc-700"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-zinc-400" />
        )}
      </div>

      {/* Bubble — constrained width, clipped overflow */}
      <div
        className={`min-w-0 max-w-[calc(100%-2.75rem)] rounded-2xl px-4 py-3 shadow-lg overflow-hidden ${
          isUser
            ? "bg-zinc-800 text-zinc-100"
            : "bg-slate-800/60 border border-zinc-700/50"
        }`}
      >
        {isThinking ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-zinc-400">Thinking...</span>
          </div>
        ) : isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <span className="inline">
            <MarkdownRenderer content={message.content} />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-zinc-400 animate-pulse" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
