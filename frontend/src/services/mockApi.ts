import type { Session, Message, Document, SendMessagePayload } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockSessions: Session[] = [
  {
    id: "sess-1",
    title: "Understanding React Hooks",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T14:22:00Z",
  },
  {
    id: "sess-2",
    title: "TypeScript Best Practices",
    created_at: "2024-01-14T09:15:00Z",
    updated_at: "2024-01-14T11:45:00Z",
  },
  {
    id: "sess-3",
    title: "Building REST APIs",
    created_at: "2024-01-13T16:00:00Z",
    updated_at: "2024-01-13T18:30:00Z",
  },
  {
    id: "sess-4",
    title: "Database Design Patterns",
    created_at: "2024-01-12T08:45:00Z",
    updated_at: "2024-01-12T10:15:00Z",
  },
];

const mockMessages: Record<string, Message[]> = {
  "sess-1": [
    {
      id: "msg-1",
      session_id: "sess-1",
      role: "user",
      content: "Can you explain React hooks?",
      created_at: "2024-01-15T10:30:00Z",
    },
    {
      id: "msg-2",
      session_id: "sess-1",
      role: "assistant",
      content: `# React Hooks Overview

React Hooks allow you to use state and other React features in functional components.

## Common Hooks

### useState
\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

### useEffect
\`\`\`jsx
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## Key Benefits

- **Simpler code**: No class components needed
- **Reusability**: Custom hooks for shared logic
- **Better organization**: Related code grouped together

| Hook | Purpose |
|------|---------|
| useState | Local state |
| useEffect | Side effects |
| useContext | Context API |
| useRef | Mutable refs |

Would you like me to explain any specific hook in detail?`,
      created_at: "2024-01-15T10:31:00Z",
    },
    {
      id: "msg-3",
      session_id: "sess-1",
      role: "user",
      content: "What about custom hooks?",
      created_at: "2024-01-15T10:35:00Z",
    },
    {
      id: "msg-4",
      session_id: "sess-1",
      role: "assistant",
      content: `# Custom Hooks

Custom hooks let you extract component logic into reusable functions.

## Creating a Custom Hook

\`\`\`tsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Usage
function MyComponent() {
  const { width, height } = useWindowSize();
  return <div>Window: {width} x {height}</div>;
}
\`\`\`

## Best Practices

1. Use the \`use\` prefix
2. Keep them focused on one task
3. Return only what's needed
4. Handle cleanup properly`,
      created_at: "2024-01-15T10:36:00Z",
    },
  ],
  "sess-2": [
    {
      id: "msg-5",
      session_id: "sess-2",
      role: "user",
      content: "What are TypeScript best practices?",
      created_at: "2024-01-14T09:15:00Z",
    },
    {
      id: "msg-6",
      session_id: "sess-2",
      role: "assistant",
      content: `# TypeScript Best Practices

## Use Strict Mode
Enable strict mode in \`tsconfig.json\`:
\`\`\`json
{
  "compilerOptions": {
    "strict": true
  }
}
\`\`\`

## Prefer Interfaces
\`\`\`ts
interface User {
  id: string;
  name: string;
  email: string;
}
\`\`\`

## Key Principles

- Avoid \`any\` when possible
- Use union types for known values
- Leverage type inference
- Create reusable utility types`,
      created_at: "2024-01-14T09:16:00Z",
    },
  ],
  "sess-3": [
    {
      id: "msg-7",
      session_id: "sess-3",
      role: "user",
      content: "How do I design a REST API?",
      created_at: "2024-01-13T16:00:00Z",
    },
    {
      id: "msg-8",
      session_id: "sess-3",
      role: "assistant",
      content: `# REST API Design

## HTTP Methods

| Method | Use Case |
|--------|----------|
| GET | Retrieve resources |
| POST | Create new resource |
| PUT | Update entire resource |
| PATCH | Partial update |
| DELETE | Remove resource |

## URL Structure
\`\`\`
GET    /api/users          # List users
GET    /api/users/:id      # Get single user
POST   /api/users          # Create user
PUT    /api/users/:id      # Update user
DELETE /api/users/:id      # Delete user
\`\`\`

## Response Codes
- **200**: Success
- **201**: Created
- **400**: Bad request
- **404**: Not found
- **500**: Server error`,
      created_at: "2024-01-13T16:01:00Z",
    },
  ],
  "sess-4": [
    {
      id: "msg-9",
      session_id: "sess-4",
      role: "user",
      content: "Explain database normalization",
      created_at: "2024-01-12T08:45:00Z",
    },
    {
      id: "msg-10",
      session_id: "sess-4",
      role: "assistant",
      content: `# Database Normalization

## Normal Forms

### First Normal Form (1NF)
- No duplicate rows
- Atomic values in each cell

### Second Normal Form (2NF)
- Meets 1NF
- No partial dependencies

### Third Normal Form (3NF)
- Meets 2NF
- No transitive dependencies

## Example

\`\`\`sql
-- Before normalization
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_name VARCHAR(100),
  customer_address VARCHAR(255),
  product_name VARCHAR(100),
  product_price DECIMAL
);

-- After normalization
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  address VARCHAR(255)
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  product_id INT REFERENCES products(id)
);
\`\`\``,
      created_at: "2024-01-12T08:46:00Z",
    },
  ],
};

const mockDocuments: Document[] = [
  {
    id: "doc-1",
    filename: "product-specification.pdf",
    status: "processed",
    uploaded_at: "2024-01-15T09:30:00Z",
    size: 2456789,
  },
  {
    id: "doc-2",
    filename: "api-documentation.pdf",
    status: "processed",
    uploaded_at: "2024-01-14T14:22:00Z",
    size: 1234567,
  },
  {
    id: "doc-3",
    filename: "research-paper.pdf",
    status: "parsing",
    uploaded_at: "2024-01-15T11:00:00Z",
    size: 5678901,
  },
  {
    id: "doc-4",
    filename: "scanned-invoice.pdf",
    status: "ocr_engaged",
    uploaded_at: "2024-01-15T11:30:00Z",
    size: 234567,
  },
];

export async function getSessions(): Promise<Session[]> {
  await delay(1500);
  return mockSessions;
}

export async function getDocuments(): Promise<Document[]> {
  await delay(1500);
  return mockDocuments;
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  await delay(1500);
  return mockMessages[sessionId] || [];
}

export async function sendMessage(
  payload: SendMessagePayload
): Promise<Message> {
  await delay(2000);

  const userMessage: Message = {
    id: `msg-${Date.now()}`,
    session_id: payload.sessionId,
    role: "user",
    content: payload.content,
    created_at: new Date().toISOString(),
  };

  const assistantResponses = [
    `# Analysis Complete

I've processed your query and here are my findings:

## Key Points

1. **First observation**: Your question touches on important concepts
2. **Second point**: There are multiple approaches to consider
3. **Recommendation**: Based on context, I suggest the following

\`\`\`typescript
const solution = {
  approach: 'systematic',
  steps: ['analyze', 'implement', 'verify']
};
\`\`\`

Would you like me to elaborate on any specific aspect?`,
    `# Implementation Details

Here's a comprehensive breakdown:

## Step-by-Step Guide

### Phase 1: Setup
- Configure your environment
- Install dependencies
- Initialize the project

### Phase 2: Development
- Create core components
- Implement business logic
- Add error handling

| Task | Priority | Status |
|------|----------|--------|
| Setup | High | Done |
| Core | High | In Progress |
| Testing | Medium | Pending |

\`\`\`bash
npm init -y
npm install express typescript
\`\`\``,
    `# Solution Overview

Based on your requirements, here's what I recommend:

## Architecture

\`\`\`
src/
├── components/
├── hooks/
├── services/
└── utils/
\`\`\`

## Key Features

- **Modularity**: Clean separation of concerns
- **Type safety**: Full TypeScript support
- **Performance**: Optimized rendering

Let me know if you need specific code examples!`,
  ];

  const assistantMessage: Message = {
    id: `msg-${Date.now() + 1}`,
    session_id: payload.sessionId,
    role: "assistant",
    content: assistantResponses[Math.floor(Math.random() * assistantResponses.length)],
    created_at: new Date().toISOString(),
  };

  if (!mockMessages[payload.sessionId]) {
    mockMessages[payload.sessionId] = [];
  }
  mockMessages[payload.sessionId].push(userMessage, assistantMessage);

  return assistantMessage;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await delay(400);
  const idx = mockSessions.findIndex((s) => s.id === sessionId);
  if (idx !== -1) mockSessions.splice(idx, 1);
  delete mockMessages[sessionId];
}

export async function uploadDocument(file: File): Promise<Document> {
  await delay(2500);

  const statuses: Document["status"][] = ["processed", "parsing", "ocr_engaged"];
  const newDocument: Document = {
    id: `doc-${Date.now()}`,
    filename: file.name,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    uploaded_at: new Date().toISOString(),
    size: file.size,
  };

  mockDocuments.unshift(newDocument);
  return newDocument;
}
