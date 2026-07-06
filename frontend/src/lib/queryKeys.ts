export const QUERY_KEYS = {
  sessions: ["sessions"] as const,
  documents: ["documents"] as const,
  messages: (sessionId: string) => ["messages", sessionId] as const,
};
