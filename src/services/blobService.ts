import { upload } from '@vercel/blob/client';
import type { PutBlobResult } from '@vercel/blob';

export type BlobUploadResult = PutBlobResult;

export async function uploadImageToBlob(file: File, options?: { folder?: string }): Promise<BlobUploadResult> {
  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
  const pathnamePrefix = options?.folder ? `${options.folder}/` : '';
  const pathname = `${pathnamePrefix}${Date.now()}-${file.name}`;

  const blob = await upload(pathname, file, {
    access: 'public',
    contentType: file.type || 'application/octet-stream',
    handleUploadUrl: `${API_BASE}/api/blob-upload`,
  });

  return blob;
}