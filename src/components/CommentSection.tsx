import { useState } from 'preact/hooks';

interface Comment {
  id: number;
  name: string;
  comment: string;
  created_at: string;
}

interface Props {
  problemId: number;
  initialComments: Comment[];
}

export default function CommentSection({ problemId, initialComments }: Props) {
  const [comments] = useState<Comment[]>(initialComments);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          name: data.get('name'),
          email: data.get('email'),
          comment: data.get('comment'),
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSubmitted(true);
        form.reset();
      } else {
        setError(result.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr + 'Z').toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <section class="mt-12">
      <h2 class="text-2xl font-bold mb-6">Kommentare</h2>

      {comments.length === 0 ? (
        <p class="text-base-content/70 italic mb-8">
          Noch keine Kommentare. Sei der/die Erste!
        </p>
      ) : (
        <div class="space-y-4 mb-8">
          {comments.map((c) => (
            <div key={c.id} class="bg-base-200 rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <span class="font-semibold">{c.name}</span>
                <span class="text-xs text-base-content/70">{formatDate(c.created_at)}</span>
              </div>
              <p class="text-base-content/80">{c.comment}</p>
            </div>
          ))}
        </div>
      )}

      {submitted ? (
        <div class="alert alert-success">
          <span>Danke! Dein Kommentar wird nach Prüfung veröffentlicht.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="bg-base-200 rounded-lg p-6">
          <h3 class="font-semibold mb-4">Kommentar schreiben</h3>
          {error && (
            <div class="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label" for="comment-name">
                  <span class="label-text">Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="comment-name"
                  required
                  class="input input-bordered w-full"
                />
              </div>
              <div class="form-control">
                <label class="label" for="comment-email">
                  <span class="label-text">E-Mail *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="comment-email"
                  required
                  class="input input-bordered w-full"
                />
                <label class="label">
                  <span class="label-text-alt">Wird nicht veröffentlicht</span>
                </label>
              </div>
            </div>
            <div class="form-control">
              <label class="label" for="comment-text">
                <span class="label-text">Kommentar *</span>
              </label>
              <textarea
                name="comment"
                id="comment-text"
                required
                class="textarea textarea-bordered w-full"
                rows={4}
              />
            </div>
            <button type="submit" class="btn btn-primary self-end" disabled={loading}>
              {loading ? 'Wird gesendet…' : 'Kommentar absenden'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
