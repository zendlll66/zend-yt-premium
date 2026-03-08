import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME ?? "";
const publicBaseUrl = process.env.R2_PUBLIC_URL ?? ""; // e.g. https://pub-xxx.r2.dev or custom domain

function getClient(): S3Client | null {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

/** Upload buffer to R2. Returns storage key (e.g. "products/abc-123.jpg") or null on failure. */
export async function uploadToR2(
  folder: string,
  buffer: Buffer,
  contentType: string,
  originalFilename: string
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const ext = originalFilename.split(".").pop()?.toLowerCase() || "bin";
  const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext : "bin";
  const key = `${folder.replace(/^\/|\/$/g, "")}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return key;
  } catch {
    return null;
  }
}

/** Delete object from R2 by key. Returns true if deleted or client not configured. */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!key?.trim()) return true;
  const client = getClient();
  if (!client) return true;

  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

/** Build public URL for a stored key. Returns empty string if no public URL configured. */
export function getR2PublicUrl(key: string): string {
  if (!key?.trim() || !publicBaseUrl) return "";
  const base = publicBaseUrl.replace(/\/$/, "");
  return `${base}/${key}`;
}

export function isR2Configured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey && bucketName);
}
