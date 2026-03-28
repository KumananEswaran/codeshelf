import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
]);
const FILE_EXTENSIONS = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".csv",
  ".toml",
  ".ini",
]);

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);
const FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function validateUpload(
  filename: string,
  mimeType: string,
  size: number,
  itemType: "file" | "image"
): { valid: true } | { valid: false; error: string } {
  const ext = getExtension(filename);

  if (itemType === "image") {
    if (!IMAGE_EXTENSIONS.has(ext)) {
      return { valid: false, error: `Invalid image extension: ${ext}` };
    }
    if (!IMAGE_MIME_TYPES.has(mimeType)) {
      return { valid: false, error: `Invalid image MIME type: ${mimeType}` };
    }
    if (size > MAX_IMAGE_SIZE) {
      return { valid: false, error: "Image must be under 5 MB" };
    }
  } else {
    if (!FILE_EXTENSIONS.has(ext)) {
      return { valid: false, error: `Invalid file extension: ${ext}` };
    }
    if (!FILE_MIME_TYPES.has(mimeType)) {
      return { valid: false, error: `Invalid file MIME type: ${mimeType}` };
    }
    if (size > MAX_FILE_SIZE) {
      return { valid: false, error: "File must be under 10 MB" };
    }
  }

  return { valid: true };
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export async function getFromR2(
  key: string
): Promise<{ body: ReadableStream; contentType: string | undefined }> {
  const response = await r2.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  return {
    body: response.Body!.transformToWebStream(),
    contentType: response.ContentType,
  };
}

export function getR2KeyFromUrl(fileUrl: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !fileUrl.startsWith(publicUrl)) return null;
  return fileUrl.slice(publicUrl.length + 1); // +1 for the /
}
