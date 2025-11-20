import { createUploadUrl } from '@vercel/blob';

export const runtime = 'edge';

function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.BLOB_ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const defaults = ['http://localhost:4173', 'http://localhost:5173'];
  // Unir y desduplicar
  return Array.from(new Set([...defaults, ...fromEnv]));
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const urlObj = new URL(request.url);
    const folder = urlObj.searchParams.get('folder') || 'uploads';
    const contentType = urlObj.searchParams.get('contentType') || 'image/*';

    const { url } = await createUploadUrl({
      access: 'public',
      contentType,
      allowedOrigins: getAllowedOrigins(),
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return new Response(
      JSON.stringify({ uploadUrl: url, folder }),
      { headers: { 'content-type': 'application/json' }, status: 200 }
    );
  } catch (e) {
    console.error('Error creando upload URL:', e);
    return new Response(
      JSON.stringify({ error: 'No se pudo crear upload URL' }),
      { headers: { 'content-type': 'application/json' }, status: 500 }
    );
  }
}