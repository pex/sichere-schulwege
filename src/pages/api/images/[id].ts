import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getImageById } from '../../../lib/db';

const FORMAT_MAP: Record<string, keyof sharp.FormatEnum> = {
  webp: 'webp',
  jpeg: 'jpeg',
  jpg: 'jpeg',
  png: 'png',
  avif: 'avif',
};

const MIME_MAP: Record<string, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
};

export const GET: APIRoute = async ({ params, url }) => {
  const id = Number(params.id);
  if (!id || isNaN(id)) {
    return new Response('Bad request', { status: 400 });
  }

  const image = getImageById(id);
  if (!image) {
    return new Response('Not found', { status: 404 });
  }

  const w = url.searchParams.get('w');
  const h = url.searchParams.get('h');
  const q = url.searchParams.get('q');
  const f = url.searchParams.get('f');

  const width = w ? Math.min(Math.max(1, parseInt(w, 10)), 2000) : undefined;
  const height = h ? Math.min(Math.max(1, parseInt(h, 10)), 2000) : undefined;
  const quality = q ? Math.min(Math.max(1, parseInt(q, 10)), 100) : 80;

  let pipeline = sharp(image.data);

  if (width || height) {
    pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
  }

  let outputMime = image.mime_type;
  const formatKey = f ? FORMAT_MAP[f.toLowerCase()] : undefined;

  if (formatKey) {
    pipeline = pipeline.toFormat(formatKey, { quality });
    outputMime = MIME_MAP[formatKey] || image.mime_type;
  } else {
    // Apply quality to original format
    const origFormat = image.mime_type.split('/')[1] as keyof sharp.FormatEnum;
    if (origFormat === 'jpeg' || origFormat === 'webp' || origFormat === 'png' || origFormat === 'avif') {
      pipeline = pipeline.toFormat(origFormat, { quality });
    }
  }

  const outputBuffer = await pipeline.toBuffer();

  return new Response(outputBuffer, {
    status: 200,
    headers: {
      'Content-Type': outputMime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
