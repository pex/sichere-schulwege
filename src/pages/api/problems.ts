import type { APIRoute } from 'astro';
import { createProblem } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, description, location_name, latitude, longitude, image_url } = body;

    if (!title || !description || !location_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Titel, Beschreibung und Ort sind Pflichtfelder.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lat = latitude ? parseFloat(latitude) : 0;
    const lng = longitude ? parseFloat(longitude) : 0;

    createProblem({
      title: String(title).slice(0, 200),
      description: String(description).slice(0, 5000),
      location_name: String(location_name).slice(0, 300),
      latitude: lat,
      longitude: lng,
      image_url: image_url ? String(image_url).slice(0, 500) : undefined,
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
