"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileIcon, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  itemType: "file" | "image";
  onUploadComplete: (result: UploadResult) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.svg";
const FILE_ACCEPT = ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini";

export function FileUpload({
  itemType,
  onUploadComplete,
  onUploadError,
  disabled,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = itemType === "image";
  const accept = isImage ? IMAGE_ACCEPT : FILE_ACCEPT;
  const maxSize = isImage ? "5 MB" : "10 MB";

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("itemType", itemType);

      try {
        const xhr = new XMLHttpRequest();

        const result = await new Promise<UploadResult>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || "Upload failed"));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        setUploadedFile(result);
        onUploadComplete(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        onUploadError(message);
      } finally {
        setUploading(false);
      }
    },
    [itemType, onUploadComplete, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  if (uploadedFile) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          {isImage ? (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {uploadedFile.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              {(uploadedFile.fileSize / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearFile}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {isImage && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedFile.fileUrl}
              alt={uploadedFile.fileName}
              className="max-h-48 rounded-md object-contain"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50"
      } ${disabled || uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {uploading ? (
        <div className="space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <div className="mx-auto w-48 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{progress}%</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop your {isImage ? "image" : "file"} here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxSize} &middot;{" "}
            {isImage
              ? "PNG, JPG, GIF, WebP, SVG"
              : "PDF, TXT, MD, JSON, YAML, XML, CSV, TOML, INI"}
          </p>
        </div>
      )}
    </div>
  );
}
