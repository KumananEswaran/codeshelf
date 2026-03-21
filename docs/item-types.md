# Item Types Reference

All knowledge saved in CodeShelf is an **Item**. Each item belongs to one of 7 system-defined types (Pro users can also create custom types).

---

## System Item Types

### 1. Snippet

| Property | Value |
|---|---|
| **ID** | `snippet` |
| **Icon** | `Code` (Lucide) |
| **Color** | `#3b82f6` (blue) |
| **Purpose** | Code blocks with syntax highlighting |
| **Content model** | Text-based (`contentType: "text"`) |
| **Key fields** | `content` (code), `language` (for syntax highlighting) |

### 2. Prompt

| Property | Value |
|---|---|
| **ID** | `prompt` |
| **Icon** | `Sparkles` (Lucide) |
| **Color** | `#8b5cf6` (purple) |
| **Purpose** | AI prompts and workflow templates |
| **Content model** | Text-based (`contentType: "text"`) |
| **Key fields** | `content` (prompt text) |

### 3. Command

| Property | Value |
|---|---|
| **ID** | `command` |
| **Icon** | `Terminal` (Lucide) |
| **Color** | `#f97316` (orange) |
| **Purpose** | Terminal / CLI commands and scripts |
| **Content model** | Text-based (`contentType: "text"`) |
| **Key fields** | `content` (command text) |

### 4. Note

| Property | Value |
|---|---|
| **ID** | `note` |
| **Icon** | `StickyNote` (Lucide) |
| **Color** | `#fde047` (yellow) |
| **Purpose** | Markdown-formatted text notes |
| **Content model** | Text-based (`contentType: "text"`) |
| **Key fields** | `content` (markdown text) |

### 5. File

| Property | Value |
|---|---|
| **ID** | `file` |
| **Icon** | `File` (Lucide) |
| **Color** | `#6b7280` (gray) |
| **Purpose** | Uploaded documents and templates |
| **Content model** | File-based (`contentType: "file"`) |
| **Key fields** | `fileUrl`, `fileName`, `fileSize` |
| **Tier** | Pro only |

### 6. Image

| Property | Value |
|---|---|
| **ID** | `image` |
| **Icon** | `Image` (Lucide) |
| **Color** | `#ec4899` (pink) |
| **Purpose** | Screenshots, diagrams, visual references |
| **Content model** | File-based (`contentType: "file"`) |
| **Key fields** | `fileUrl`, `fileName`, `fileSize` |
| **Tier** | Pro only (uploads); free users can view |

### 7. Link

| Property | Value |
|---|---|
| **ID** | `link` |
| **Icon** | `Link` (Lucide) |
| **Color** | `#10b981` (green) |
| **Purpose** | Bookmarked URLs with metadata |
| **Content model** | URL-based (`contentType: "text"`) |
| **Key fields** | `url`, `description`, `content` (optional notes) |

---

## Classification Summary

### By content model

| Classification | Types | Primary field |
|---|---|---|
| **Text** | Snippet, Prompt, Command, Note | `content` |
| **File** | File, Image | `fileUrl`, `fileName`, `fileSize` |
| **URL** | Link | `url`, `description` |

### Shared properties (all types)

Every item, regardless of type, has these fields:

| Field | Type | Description |
|---|---|---|
| `id` | `String` | Unique identifier (cuid) |
| `title` | `String` | Display title |
| `contentType` | `String` | `"text"` or `"file"` |
| `isFavorite` | `Boolean` | Starred by user |
| `isPinned` | `Boolean` | Pinned to dashboard |
| `userId` | `String` | Owner reference |
| `typeId` | `String` | References `ItemType.id` |
| `collectionId` | `String?` | Optional collection |
| `tags` | `ItemTag[]` | Many-to-many tags |
| `createdAt` | `DateTime` | Creation timestamp |
| `updatedAt` | `DateTime` | Last modified |

### Display differences

| Type | Syntax highlighting | URL preview | File preview | Markdown rendering |
|---|---|---|---|---|
| Snippet | Yes (`language` field) | No | No | No |
| Prompt | No | No | No | Potential |
| Command | Potential (bash) | No | No | No |
| Note | No | No | No | Yes |
| File | No | No | Yes (download) | No |
| Image | No | No | Yes (visual) | No |
| Link | No | Yes (clickable) | No | No |

### Pro-gated types

The sidebar marks **File** and **Image** types with a PRO badge (defined via `PRO_TYPES` set in [Sidebar.tsx](src/components/dashboard/Sidebar.tsx)). These types require file upload capability via Cloudflare R2, which is a Pro-tier feature.

---

## Icon mapping

Icons are resolved at runtime via [src/lib/icon-map.ts](src/lib/icon-map.ts):

- `ICON_MAP` — maps Lucide icon name strings to components
- `getIcon(name)` — safe lookup with `Code` as fallback

The `ItemType.icon` field in the database stores the Lucide component name (e.g., `"Code"`, `"Sparkles"`), not the display label.

---

## Custom types (Pro)

Pro users can create custom `ItemType` records with:

- Custom `name`, `icon`, and `color`
- `isSystem: false` (distinguishes from built-in types)
- `userId` set to the creating user (system types have `userId: null`)

Custom types behave identically to system types — they use the same `Item` model and fields.
