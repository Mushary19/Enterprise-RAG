import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";

interface ChatMessagesProps {
  messages: ChatMessage[] | undefined;
  isLoading: boolean;
  streamingMessageId: string | null;
}

export function ChatMessages({
  messages,
  isLoading,
  streamingMessageId,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: streamingMessageId ? "auto" : "smooth",
    });
  }, [messages, streamingMessageId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-zinc-400 mb-2">Start a new conversation</p>
          <p className="text-sm text-zinc-500">
            Ask a question or upload a document to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-5 w-full">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
