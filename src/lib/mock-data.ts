export const mockUser = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  isPro: true,
};

export const mockItemTypes = [
  { id: "type_snippet", name: "Snippet", icon: "</>", color: "#60a5fa", isSystem: true },
  { id: "type_prompt", name: "Prompt", icon: "🤖", color: "#a78bfa", isSystem: true },
  { id: "type_command", name: "Command", icon: ">_", color: "#34d399", isSystem: true },
  { id: "type_note", name: "Note", icon: "📝", color: "#fbbf24", isSystem: true },
  { id: "type_file", name: "File", icon: "📄", color: "#f87171", isSystem: true },
  { id: "type_image", name: "Image", icon: "🖼️", color: "#fb923c", isSystem: true },
  { id: "type_url", name: "URL", icon: "🔗", color: "#38bdf8", isSystem: true },
];

export const mockCollections = [
  {
    id: "col_1",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    itemCount: 12,
    isFavorite: true,
  },
  {
    id: "col_2",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    itemCount: 8,
    isFavorite: false,
  },
  {
    id: "col_3",
    name: "Context Files",
    description: "AI context files for projects",
    itemCount: 5,
    isFavorite: true,
  },
  {
    id: "col_4",
    name: "Interview Prep",
    description: "Technical interview preparation",
    itemCount: 24,
    isFavorite: false,
  },
  {
    id: "col_5",
    name: "Git Commands",
    description: "Frequently used git commands",
    itemCount: 15,
    isFavorite: true,
  },
  {
    id: "col_6",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    itemCount: 18,
    isFavorite: false,
  },
];

export const mockItems = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "text",
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthP...')
  }
  return context
}`,
    typeId: "type_snippet",
    typeName: "Snippet",
    collectionId: "col_1",
    collectionName: "React Patterns",
    tags: ["react", "auth", "hooks"],
    isFavorite: true,
    isPinned: true,
    language: "typescript",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "text",
    content: `async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      return await res.json()
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 2 ** i * 1000))
    }
  }
}`,
    typeId: "type_snippet",
    typeName: "Snippet",
    collectionId: "col_1",
    collectionName: "React Patterns",
    tags: ["api", "error-handling", "typescript"],
    isFavorite: false,
    isPinned: true,
    language: "typescript",
    createdAt: "2024-01-12T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z",
  },
  {
    id: "item_3",
    title: "Git Stash Workflow",
    description: "Save and restore work in progress",
    contentType: "text",
    content: `git stash push -m "WIP: feature description"
git stash list
git stash pop`,
    typeId: "type_command",
    typeName: "Command",
    collectionId: "col_5",
    collectionName: "Git Commands",
    tags: ["git", "workflow"],
    isFavorite: false,
    isPinned: false,
    language: "bash",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "item_4",
    title: "Code Review Prompt",
    description: "Prompt for thorough AI code reviews",
    contentType: "text",
    content: `Review the following code for:
1. Security vulnerabilities
2. Performance issues
3. Code quality and readability
4. Edge cases not handled

Code: [paste code here]`,
    typeId: "type_prompt",
    typeName: "Prompt",
    collectionId: "col_6",
    collectionName: "AI Prompts",
    tags: ["code-review", "ai", "productivity"],
    isFavorite: true,
    isPinned: false,
    language: null,
    createdAt: "2024-01-08T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z",
  },
  {
    id: "item_5",
    title: "System Design Interview Notes",
    description: "Key concepts for system design interviews",
    contentType: "text",
    content: `# System Design Checklist
- Clarify requirements (functional + non-functional)
- Estimate scale (users, requests/sec, storage)
- High-level design (components + data flow)
- Deep dive on critical components
- Discuss trade-offs`,
    typeId: "type_note",
    typeName: "Note",
    collectionId: "col_4",
    collectionName: "Interview Prep",
    tags: ["interview", "system-design"],
    isFavorite: false,
    isPinned: false,
    language: null,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
  },
];

export const mockItemTypeCounts = {
  type_snippet: 24,
  type_prompt: 18,
  type_command: 15,
  type_note: 12,
  type_file: 5,
  type_image: 3,
  type_url: 8,
};
