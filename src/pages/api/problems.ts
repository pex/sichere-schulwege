import type { APIRoute } from 'astro';
import { createProblem, insertImageAsync } from '../../lib/db';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, description, location_name, latitude, longitude, image_data, image_filename } = body;

    if (!title || !description || !location_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Titel, Beschreibung und Ort sind Pflichtfelder.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lat = latitude ? parseFloat(latitude) : 0;
    const lng = longitude ? parseFloat(longitude) : 0;

    let imageId: number | undefined;

    if (image_data && typeof image_data === 'string') {
      const buffer = Buffer.from(image_data, 'base64');

      if (buffer.length > MAX_IMAGE_SIZE) {
        return new Response(
          JSON.stringify({ success: false, error: 'Bild darf maximal 5 MB groß sein.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const filename = image_filename ? String(image_filename).slice(0, 200) : undefined;
      const ext = filename?.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      imageId = await insertImageAsync(buffer, mimeType, filename);
    }

    createProblem({
      title: String(title).slice(0, 200),
      description: String(description).slice(0, 5000),
      location_name: String(location_name).slice(0, 300),
      latitude: lat,
      longitude: lng,
      image_id: imageId,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Ein Fehler ist aufgetreten.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
