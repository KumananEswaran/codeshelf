import {
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Download,
  Star,
  Pin,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { ItemWithDetails } from "@/lib/db/items";

const EXTENSION_ICONS: Record<string, typeof File> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  md: FileText,
  js: FileCode,
  ts: FileCode,
  jsx: FileCode,
  tsx: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  json: FileCode,
  yaml: FileCode,
  yml: FileCode,
  html: FileCode,
  css: FileCode,
  svg: FileImage,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  rar: FileArchive,
  "7z": FileArchive,
  csv: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
};

function getFileIcon(fileName: string | null) {
  if (!fileName) return File;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_ICONS[ext] ?? File;
}

interface FileListItemProps {
  item: ItemWithDetails;
  onClick?: () => void;
}

export default function FileListItem({ item, onClick }: FileListItemProps) {
  const IconComponent = getFileIcon(item.fileName);

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!item.fileUrl) return;
    const urlParts = item.fileUrl.split("/");
    const key = urlParts.slice(3).join("/");
    window.open(`/api/download/${encodeURIComponent(key)}`, "_blank");
  }

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted shrink-0 text-muted-foreground">
        <IconComponent className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{item.title}</p>
          {item.isFavorite && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
          )}
          {item.isPinned && (
            <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate">
            {item.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground truncate md:hidden">
          {item.fileSize ? formatFileSize(item.fileSize) : "—"}
          {" · "}
          {formatDate(item.createdAt)}
        </p>
      </div>

      <span className="hidden md:block text-sm text-muted-foreground shrink-0 w-20 text-right">
        {item.fileSize ? formatFileSize(item.fileSize) : "—"}
      </span>

      <span className="hidden md:block text-sm text-muted-foreground shrink-0 w-24 text-right">
        {formatDate(item.createdAt)}
      </span>

      {item.fileUrl && (
        <button
          onClick={handleDownload}
          className="shrink-0 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
