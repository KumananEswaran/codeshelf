# AI Integration Plan

> Auto-tagging, summaries, code explanation, and prompt optimization powered by OpenAI gpt-5-nano.

---

## 1. SDK Setup & Configuration

### Option A: OpenAI Node SDK (Direct)

```bash
npm install openai
```

```typescript
// src/lib/openai.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2, // built-in retry with exponential backoff
});

export default openai;
```

### Option B: Vercel AI SDK (Recommended)

The Vercel AI SDK provides a higher-level abstraction with built-in streaming, structured outputs, and Next.js-native patterns. Since CodeShelf is a Next.js + Vercel project, this is the better fit.

```bash
npm install ai @ai-sdk/openai
```

```typescript
// src/lib/ai.ts
import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const nanoModel = openai("gpt-5-nano");
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
```

Add `OPENAI_API_KEY` to `.env.example` and Vercel environment settings.

### Recommendation

**Use the Vercel AI SDK** (`ai` + `@ai-sdk/openai`). It provides:
- `generateText` for one-shot completions (auto-tag, summarize)
- `streamText` for streaming responses (explain code, optimize prompt)
- `Output.object` with Zod schemas for structured/typed responses
- Built-in Next.js server action and route handler support
- Automatic retries and error handling

---

## 2. Feature Implementations

### 2.1 Auto-Tagging

**When:** After item creation or on-demand via a "Suggest Tags" button.

**Pattern:** Non-streaming, structured output (returns a JSON array of tags).

```typescript
// src/actions/ai.ts
"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { nanoModel } from "@/lib/ai";

const tagsSchema = z.object({
  tags: z.array(z.string().min(1).max(30)).max(5),
});

export async function suggestTags(content: string, title: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  const { output } = await generateText({
    model: nanoModel,
    output: Output.object({ schema: tagsSchema }),
    system: `You are a developer tool that suggests relevant tags for code snippets, notes, and developer content. Return 3-5 short, lowercase tags. Use common developer terminology.`,
    prompt: `Title: ${title}\n\nContent:\n${content.slice(0, 2000)}`,
  });

  return { success: true as const, data: output.tags };
}
```

**Prompting notes for gpt-5-nano:**
- Keep prompts narrow and well-bounded
- Prefer closed outputs (labels, enums, short JSON)
- Include one correct example in the prompt if results are inconsistent
- Avoid multi-step orchestration

### 2.2 AI Summaries

**When:** On-demand via "Summarize" button in ItemDrawer.

**Pattern:** Non-streaming, plain text response.

```typescript
export async function summarizeContent(content: string, title: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  const { text } = await generateText({
    model: nanoModel,
    system: `Summarize the following developer content in 2-3 concise sentences. Focus on what it does and when to use it.`,
    prompt: `Title: ${title}\n\nContent:\n${content.slice(0, 4000)}`,
  });

  return { success: true as const, data: text };
}
```

### 2.3 Code Explanation

**When:** On-demand via "Explain" button on snippet/command items.

**Pattern:** Streaming recommended (explanations can be longer).

**Server Action (streaming with RSC):**

```typescript
"use server";

import { streamText } from "ai";
import { createStreamableValue } from "@ai-sdk/rsc";
import { auth } from "@/auth";
import { nanoModel } from "@/lib/ai";

export async function explainCode(code: string, language?: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  const stream = createStreamableValue("");

  (async () => {
    const { textStream } = streamText({
      model: nanoModel,
      system: `You are a code explainer for developers. Explain the following ${language || "code"} clearly and concisely. Use bullet points for key concepts. Keep it under 300 words.`,
      prompt: code.slice(0, 4000),
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();

  return { success: true as const, data: stream.value };
}
```

**Alternative: API Route (for simpler client consumption):**

```typescript
// src/app/api/ai/explain/route.ts
import { streamText } from "ai";
import { auth } from "@/auth";
import { nanoModel } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isPro) {
    return Response.json({ error: "Pro required" }, { status: 403 });
  }

  const { code, language } = await req.json();

  const result = streamText({
    model: nanoModel,
    system: `Explain this ${language || "code"} clearly and concisely.`,
    prompt: code.slice(0, 4000),
  });

  return result.toTextStreamResponse();
}
```

### 2.4 Prompt Optimization

**When:** On-demand via "Optimize" button on prompt items.

**Pattern:** Non-streaming, returns improved prompt text.

```typescript
export async function optimizePrompt(prompt: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  const { text } = await generateText({
    model: nanoModel,
    system: `You are an AI prompt engineer. Improve the given prompt for clarity, specificity, and effectiveness. Return only the improved prompt, no explanations. Preserve the original intent.`,
    prompt: `Original prompt:\n${prompt.slice(0, 4000)}`,
  });

  return { success: true as const, data: text };
}
```

---

## 3. Streaming vs Non-Streaming Decision Matrix

| Feature | Method | Rationale |
|---|---|---|
| Auto-tagging | `generateText` + `Output.object` | Short, structured response; needs Zod validation |
| Summaries | `generateText` | Short response (2-3 sentences); fast with nano |
| Code Explanation | `streamText` | Longer response; streaming reduces perceived latency |
| Prompt Optimization | `generateText` | Returns complete prompt; partial prompt is not useful |

### Streaming Implementation Notes

- **Server Actions + RSC:** Use `createStreamableValue` from `@ai-sdk/rsc` to stream from server actions
- **API Routes:** Use `result.toTextStreamResponse()` for standard SSE streaming
- **Client consumption:** Use `useStreamableValue` hook (RSC) or `useCompletion`/`fetch` with ReadableStream (API route)
- Streaming reduces perceived latency by ~70% for longer responses

---

## 4. Error Handling

### Server Action Pattern (matches existing codebase)

All AI actions follow the established `{ success, data, error }` return pattern from `src/actions/items.ts`:

```typescript
export async function aiAction(input: string) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  // 2. Pro gating
  if (!session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  // 3. Input validation
  if (!input?.trim()) {
    return { success: false as const, error: "Content is required" };
  }

  // 4. AI call with error handling
  try {
    const { text } = await generateText({ ... });
    return { success: true as const, data: text };
  } catch (error) {
    if (error instanceof Error) {
      // OpenAI-specific errors
      if (error.message.includes("rate_limit")) {
        return { success: false as const, error: "AI rate limit reached. Please try again in a moment." };
      }
      if (error.message.includes("context_length")) {
        return { success: false as const, error: "Content is too long for AI processing." };
      }
    }
    return { success: false as const, error: "AI feature temporarily unavailable." };
  }
}
```

### Vercel AI SDK Built-in Handling

- **Automatic retries:** 2 retries by default with exponential backoff (configurable via `maxRetries`)
- **Rate limit errors (429):** Automatically retried
- **Timeout errors:** Configurable via `abortSignal` or `timeout` option
- **API errors:** Typed `APIError` class with status code and message

---

## 5. Rate Limiting for AI Endpoints

Extend the existing `src/lib/rate-limit.ts` pattern with AI-specific limiters:

```typescript
// Add to existing limiters object in src/lib/rate-limit.ts
const limiters = {
  // ... existing auth limiters
  /** AI features: 20 requests per 5 minutes */
  ai: { requests: 20, window: "5 m" as const },
  /** Auto-tag: 10 requests per 5 minutes */
  aiTag: { requests: 10, window: "5 m" as const },
} as const;
```

Apply in server actions or API routes:

```typescript
// In API route approach
const rateLimit = await checkRateLimit("ai", req);
if (!rateLimit.success) {
  return rateLimitResponse(rateLimit.reset);
}
```

For server actions (no `Request` object), consider IP extraction from headers or per-user rate limiting using `session.user.id` as the identifier.

---

## 6. Pro User Gating

### Existing Pattern

The codebase already gates Pro features via `session.user.isPro` (set in NextAuth JWT callback from `src/auth.ts`). AI features follow the same pattern:

```typescript
// Check in every AI server action
if (!session.user.isPro) {
  return { success: false as const, error: "Pro subscription required" };
}
```

### UI Gating

Show AI buttons conditionally or with upgrade prompts:

```tsx
// In ItemDrawer or similar component
{isPro ? (
  <Button onClick={handleExplain}>Explain Code</Button>
) : (
  <Button variant="outline" onClick={() => router.push("/upgrade")}>
    Explain Code (Pro)
  </Button>
)}
```

### Update subscription.ts

Add AI features to the Pro feature set:

```typescript
// src/lib/subscription.ts
export const PRO_FEATURES = new Set(["file", "image", "ai"]);

export function requiresProFeature(feature: string): boolean {
  return PRO_FEATURES.has(feature);
}
```

---

## 7. Cost Optimization

### gpt-5-nano Pricing

- **Input:** $0.05 / 1M tokens
- **Output:** $0.40 / 1M tokens
- Extremely cost-effective for the four target features

### Strategies

| Strategy | Implementation |
|---|---|
| **Truncate input** | Cap content at 2000-4000 chars before sending |
| **Cache results** | Store AI-generated tags/summaries in the database |
| **Limit output tokens** | Set `maxTokens` (e.g., 200 for tags, 300 for summaries) |
| **Rate limit per user** | 20 AI requests per 5 minutes (see section 5) |
| **Batch auto-tags** | Don't auto-tag on every keystroke; use debounce or explicit trigger |
| **Skip if cached** | Check if item already has AI-generated tags/summary before calling |

### Database Caching

Add fields to the Item model for caching AI results:

```prisma
model Item {
  // ... existing fields
  aiSummary    String?   // Cached AI summary
  aiTags       String[]  // Cached AI-suggested tags
  aiExplain    String?   // Cached code explanation
  aiProcessed  DateTime? // When AI last processed this item
}
```

Invalidate cache when content changes (clear `aiSummary`, `aiTags`, etc. on `updateItem`).

### Estimated Costs

Assuming a Pro user makes ~50 AI requests/day:
- Average input: ~500 tokens, output: ~150 tokens
- Daily cost per user: ~$0.005
- 1000 Pro users: ~$5/day, ~$150/month

---

## 8. UI Patterns

### Loading States

```tsx
const [isLoading, setIsLoading] = useState(false);

async function handleSuggestTags() {
  setIsLoading(true);
  try {
    const result = await suggestTags(content, title);
    if (result.success) {
      setSuggestedTags(result.data);
    } else {
      toast.error(result.error);
    }
  } finally {
    setIsLoading(false);
  }
}

// Button with loading state
<Button onClick={handleSuggestTags} disabled={isLoading}>
  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
  Suggest Tags
</Button>
```

### Accept / Reject for Suggestions

For auto-tags and prompt optimization, show suggestions that the user can accept or dismiss:

```tsx
// Tag suggestions
{suggestedTags && (
  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/30">
    <span className="text-xs text-muted-foreground">Suggested:</span>
    {suggestedTags.map((tag) => (
      <Badge
        key={tag}
        variant="outline"
        className="cursor-pointer hover:bg-primary/10"
        onClick={() => addTag(tag)}
      >
        + {tag}
      </Badge>
    ))}
    <Button variant="ghost" size="sm" onClick={() => setSuggestedTags(null)}>
      Dismiss
    </Button>
  </div>
)}
```

### Streaming Text Display

For code explanation with streaming:

```tsx
"use client";

import { useStreamableValue } from "@ai-sdk/rsc";
import { readStreamableValue } from "@ai-sdk/rsc";

function ExplainPanel({ streamValue }) {
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      for await (const delta of readStreamableValue(streamValue)) {
        setText((prev) => prev + delta);
      }
    })();
  }, [streamValue]);

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
```

### Toast Feedback

Use existing Sonner toast pattern for errors and confirmations:

```tsx
toast.error("AI feature temporarily unavailable.");
toast.success("Tags suggested! Click to add them.");
```

---

## 9. Security Considerations

### API Key Handling

- Store `OPENAI_API_KEY` in environment variables only (never client-side)
- All AI calls go through server actions or API routes (never call OpenAI from the client)
- The Vercel AI SDK enforces this by design when using `generateText`/`streamText` in server actions

### Input Sanitization

- **Truncate content** before sending to OpenAI (2000-4000 chars max)
- **Strip sensitive patterns** if needed (e.g., API keys, passwords found in snippets)
- **Don't echo raw AI output as HTML** -- render through React (which escapes by default) or markdown renderers

### Output Validation

- Use `Output.object` with Zod schemas for structured responses (auto-tags)
- Validate AI-suggested tags against allowed characters/length
- Don't blindly insert AI output into SQL or shell commands

### Rate Limiting

- Per-user rate limits prevent abuse of AI endpoints
- Pro gating ensures only paying users access AI features
- Consider a daily cap (e.g., 100 AI requests/day per user) as a safety net

---

## 10. File Structure

```
src/
  lib/
    ai.ts                  # OpenAI client setup (Vercel AI SDK provider)
  actions/
    ai.ts                  # All AI server actions (suggestTags, summarize, explain, optimize)
  app/
    api/
      ai/
        explain/route.ts   # Streaming API route (alternative to server action)
  components/
    ai/
      SuggestedTags.tsx    # Accept/reject tag suggestions
      AiSummary.tsx        # Summary display with generate button
      ExplainPanel.tsx     # Streaming code explanation
      OptimizePrompt.tsx   # Before/after prompt comparison
      AiButton.tsx         # Reusable AI action button with loading state
```

---

## 11. Implementation Order

1. **Setup:** Install `ai` + `@ai-sdk/openai`, create `src/lib/ai.ts`
2. **Auto-tagging:** `suggestTags` action + UI in ItemDrawer/NewItemDialog
3. **Summaries:** `summarizeContent` action + UI in ItemDrawer
4. **Code Explanation:** `explainCode` action (streaming) + ExplainPanel
5. **Prompt Optimization:** `optimizePrompt` action + OptimizePrompt component
6. **Rate limiting:** Add AI limiters to `src/lib/rate-limit.ts`
7. **Caching:** Add `aiSummary`/`aiTags` fields to Item model, cache results
8. **Polish:** Loading states, error messages, empty states

---

## Sources

- [GPT-5 nano Model - OpenAI API](https://developers.openai.com/api/docs/models/gpt-5-nano)
- [OpenAI Streaming Responses](https://developers.openai.com/api/docs/guides/streaming-responses)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI Prompt Guidance for Nano Models](https://developers.openai.com/api/docs/guides/prompt-guidance)
- [Vercel AI SDK - Getting Started](https://ai-sdk.dev/v4/docs/getting-started/nextjs-app-router)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [GPT-5 Integration in Next.js](https://vladimirsiedykh.com/blog/gpt-5-integration-nextjs-saas-features)
- [Streaming Server Actions - Jack Herrington](https://jherr2020.medium.com/nextjss-amazing-new-streaming-server-actions-ef4f6e2b1ca2)
