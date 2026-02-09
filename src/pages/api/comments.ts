import type { APIRoute } from 'astro';
import { createComment, getProblemById } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { problemId, name, email, comment } = body;

    if (!problemId || !name || !email || !comment) {
      return new Response(
        JSON.stringify({ success: false, error: 'Alle Felder sind Pflichtfelder.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const problem = getProblemById(Number(problemId));
    if (!problem) {
      return new Response(
        JSON.stringify({ success: false, error: 'Problem nicht gefunden.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    createComment({
      problem_id: Number(problemId),
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      comment: String(comment).slice(0, 5000),
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
