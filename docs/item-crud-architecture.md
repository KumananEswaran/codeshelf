# Item CRUD Architecture

A unified CRUD system for all 7 item types: Snippet, Prompt, Command, Note, File, Image, Link.

---

## Design Principles

- **One action file** for all mutations (create, update, delete)
- **One DB query file** for all reads (already partially exists)
- **One dynamic route** (`/items/[type]`) that adapts per type
- **Type-specific logic lives in components**, not in actions or DB queries

---

## File Structure

```
src/
├── actions/
│   └── items.ts              # All item mutations (create, update, delete, toggle favorite/pin)
│
├── lib/
│   ├── db/
│   │   └── items.ts          # All item queries (exists — extend with getItemsByType, getItemById)
│   └── validations/
│       └── item.ts           # Zod schemas for item input validation
│
├── app/
│   └── dashboard/
│       └── items/
│           └── [type]/
│               └── page.tsx  # Dynamic route — server component, fetches items by type
│
├── components/
│   └── items/
│       ├── ItemList.tsx       # Grid/list view of items (shared across all types)
│       ├── ItemCard.tsx       # Single item card (adapts display by type)
│       ├── ItemDialog.tsx     # Create/Edit dialog (shared shell)
│       ├── ItemForm.tsx       # Form fields — delegates to type-specific field sets
│       ├── DeleteItemDialog.tsx  # Confirmation dialog for deletion
│       ├── fields/
│       │   ├── SnippetFields.tsx  # language selector + code editor
│       │   ├── PromptFields.tsx   # textarea for prompt content
│       │   ├── CommandFields.tsx  # textarea for command content
│       │   ├── NoteFields.tsx     # markdown editor
│       │   ├── FileFields.tsx     # file upload dropzone
│       │   ├── ImageFields.tsx    # image upload with preview
│       │   └── LinkFields.tsx     # URL input + description
│       └── displays/
│           ├── SnippetDisplay.tsx  # syntax-highlighted code block
│           ├── PromptDisplay.tsx   # formatted prompt text
│           ├── CommandDisplay.tsx  # command with copy button
│           ├── NoteDisplay.tsx     # rendered markdown
│           ├── FileDisplay.tsx     # file info + download link
│           ├── ImageDisplay.tsx    # image preview
│           └── LinkDisplay.tsx     # clickable URL with metadata
│
└── types/
    └── items.ts              # Item-related TypeScript interfaces
```

---

## Routing: `/items/[type]`

The sidebar already links to `/items/snippets`, `/items/prompts`, etc. A single dynamic route handles all types.

### Route: `src/app/dashboard/items/[type]/page.tsx`

```
URL                    →  type param  →  DB typeId
/dashboard/items/snippets  →  "snippets"  →  "snippet"
/dashboard/items/prompts   →  "prompts"   →  "prompt"
/dashboard/items/commands  →  "commands"   →  "command"
/dashboard/items/notes     →  "notes"      →  "note"
/dashboard/items/files     →  "files"      →  "file"
/dashboard/items/images    →  "images"     →  "image"
/dashboard/items/links     →  "links"      →  "link"
```

**Slug → typeId mapping**: Strip trailing "s" from the URL param (`snippets` → `snippet`). The page component validates against known type IDs and returns `notFound()` for invalid types.

**Page responsibilities**:
1. Parse `[type]` param, map to `typeId`
2. Get session (`await auth()`)
3. Fetch items via `getItemsByType(userId, typeId)`
4. Fetch the `ItemType` record for header display (icon, color, name)
5. Render `<ItemList>` with type context

---

## Server Actions: `src/actions/items.ts`

All mutations in one file. Each action:
- Authenticates via `await auth()`
- Validates input with Zod
- Returns `{ success, data?, error? }` pattern

### Actions

| Action | Purpose | Key logic |
|---|---|---|
| `createItem(formData)` | Create new item | Validates by type, enforces free-tier limit (50 items) |
| `updateItem(id, formData)` | Update existing item | Ownership check, validates by type |
| `deleteItem(id)` | Delete item | Ownership check, cascade handled by Prisma |
| `toggleFavorite(id)` | Toggle isFavorite | Ownership check, flip boolean |
| `togglePin(id)` | Toggle isPinned | Ownership check, flip boolean |

### Validation approach

One base Zod schema with type-specific refinements:

```
Base schema (all types):
  - title: string, required, max 200
  - description: string, optional, max 500
  - collectionId: string, optional
  - tags: string[], optional

Type-specific extensions:
  - Snippet: content (required), language (required)
  - Prompt: content (required)
  - Command: content (required)
  - Note: content (required)
  - File: fileUrl, fileName, fileSize (required)
  - Image: fileUrl, fileName, fileSize (required)
  - Link: url (required, valid URL), description (optional)
```

The action receives `typeId` and picks the right schema variant.

---

## Data Fetching: `src/lib/db/items.ts`

Extend the existing file with new query functions:

| Function | Purpose | Called from |
|---|---|---|
| `getPinnedItems(userId)` | Dashboard pinned items | Dashboard page (exists) |
| `getRecentItems(userId)` | Dashboard recent items | Dashboard page (exists) |
| `getItemTypesWithCounts(userId)` | Sidebar type counts | Dashboard layout (exists) |
| `getItemStats(userId)` | Dashboard stats | Dashboard page (exists) |
| **`getItemsByType(userId, typeId, options?)`** | Items list for `/items/[type]` | **New** — type page |
| **`getItemById(userId, itemId)`** | Single item detail | **New** — edit form |
| **`getUserItemCount(userId)`** | Total item count | **New** — free tier enforcement |

`getItemsByType` options: `{ search?, sortBy?, sortOrder?, limit?, offset? }` for future filtering/pagination.

---

## Component Responsibilities

### Shared Components (type-agnostic)

| Component | Role |
|---|---|
| `ItemList` | Renders grid/list of `ItemCard` components, handles empty state, passes type context |
| `ItemCard` | Displays item summary (title, icon, tags, date, favorite/pin badges). Adapts border color by type. Click opens detail/edit |
| `ItemDialog` | Modal shell for create/edit. Contains `ItemForm` + save/cancel buttons |
| `ItemForm` | Shared fields (title, description, collection, tags) + renders type-specific `*Fields` component |
| `DeleteItemDialog` | Confirmation dialog with item title, calls `deleteItem` action |

### Type-Specific Field Components (`fields/`)

Each renders only the fields unique to that type. Mounted inside `ItemForm` based on `typeId`:

| Component | Fields rendered |
|---|---|
| `SnippetFields` | Code editor textarea + language dropdown |
| `PromptFields` | Large textarea for prompt content |
| `CommandFields` | Textarea for command/script content |
| `NoteFields` | Markdown editor (textarea, later rich editor) |
| `FileFields` | File upload dropzone (Pro only) |
| `ImageFields` | Image upload with preview (Pro only) |
| `LinkFields` | URL input + description textarea |

### Type-Specific Display Components (`displays/`)

Each renders item content in the appropriate format. Used in item detail views:

| Component | Display behavior |
|---|---|
| `SnippetDisplay` | Syntax-highlighted code block with copy button |
| `PromptDisplay` | Formatted text with template variable highlighting |
| `CommandDisplay` | Monospace text with copy-to-clipboard |
| `NoteDisplay` | Rendered markdown |
| `FileDisplay` | File name, size, download button |
| `ImageDisplay` | Image preview with zoom |
| `LinkDisplay` | Clickable URL, description, optional notes |

### How type-specific rendering works

```
ItemForm receives typeId
  → switch (typeId)
    → "snippet" → <SnippetFields />
    → "prompt"  → <PromptFields />
    → ...

ItemCard receives item.type.name
  → switch (type.name)
    → "snippet" → <SnippetDisplay />
    → "link"    → <LinkDisplay />
    → ...
```

The switch lives in the component layer. Actions and DB queries are type-agnostic — they store/retrieve the same `Item` model regardless of type.

---

## Data Flow

### Create flow

```
User clicks "New Item" (TopBar or ItemList)
  → ItemDialog opens with type pre-selected (from current page)
  → ItemForm renders shared fields + type-specific fields
  → User fills form, clicks Save
  → Client calls createItem(formData) server action
  → Action: auth check → validate → check free-tier limit → prisma.item.create
  → Returns { success: true, data: item }
  → Dialog closes, page revalidates via revalidatePath
```

### Read flow

```
User navigates to /dashboard/items/snippets
  → Server component: auth() → getItemsByType(userId, "snippet")
  → Renders <ItemList items={items} type={snippetType} />
  → Each item renders as <ItemCard />
```

### Update flow

```
User clicks item card → ItemDialog opens in edit mode
  → getItemById(userId, itemId) pre-fills form
  → User edits, clicks Save
  → Client calls updateItem(id, formData) server action
  → Action: auth check → ownership check → validate → prisma.item.update
  → Dialog closes, page revalidates
```

### Delete flow

```
User clicks delete on item → DeleteItemDialog opens
  → User confirms
  → Client calls deleteItem(id) server action
  → Action: auth check → ownership check → prisma.item.delete
  → Dialog closes, page revalidates
```

---

## Free Tier Enforcement

| Resource | Free limit | Check location |
|---|---|---|
| Items | 50 | `createItem` action — call `getUserItemCount()` before insert |
| Collections | 3 | `createCollection` action (future) |
| File/Image uploads | Blocked | `createItem` action — reject if `typeId` is `file`/`image` and `!user.isPro` |
| Custom types | Blocked | Future custom type creation action |

---

## Integration Points

| System | How it connects |
|---|---|
| **Dashboard** | Existing `PinnedItems` and `RecentItems` already consume `ItemWithDetails` — no changes needed |
| **Sidebar** | Already links to `/items/[type]s` and shows counts — no changes needed |
| **TopBar** | "New Item" button needs to open `ItemDialog` — wire up with state or URL param |
| **Collections** | Items have optional `collectionId` — collection detail pages will reuse `ItemList` |
| **Tags** | Create/attach tags during item creation — manage via `ItemTag` junction table |
| **Search** | Future: query items by title/content/tags across all types |
