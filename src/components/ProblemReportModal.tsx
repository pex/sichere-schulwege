import { useState, useRef, useEffect } from 'preact/hooks';

interface Props {
  open?: boolean;
}

export default function ProblemReportModal({ open = false }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [open]);

  function openModal() {
    dialogRef.current?.showModal();
    setSubmitted(false);
    setError('');
  }

  function closeModal() {
    dialogRef.current?.close();
    setSubmitted(false);
    setError('');
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    // Read file as base64 if present
    const fileInput = form.querySelector<HTMLInputElement>('input[name="image_file"]');
    const file = fileInput?.files?.[0];
    let imageData: string | undefined;
    let imageFilename: string | undefined;

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Bild darf maximal 5 MB groß sein.');
        setLoading(false);
        return;
      }
      const buffer = await file.arrayBuffer();
      imageData = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      imageFilename = file.name;
    }

    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.get('title'),
          description: data.get('description'),
          location_name: data.get('location_name'),
          latitude: data.get('latitude') || '0',
          longitude: data.get('longitude') || '0',
          image_data: imageData,
          image_filename: imageFilename,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  // Expose open function on the global scope for the floating button
  if (typeof window !== 'undefined') {
    (window as any).__openReportModal = openModal;
  }

  return (
    <>
      <dialog ref={dialogRef} class="modal" id="report-modal">
        <div class="modal-box w-full max-w-lg">
          {submitted ? (
            <div class="text-center py-4">
              <div class="text-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Danke für deine Meldung!</h3>
              <p class="text-base-content/70 mb-6">
                Wir werden sie prüfen und hier veröffentlichen.
              </p>
              <p class="text-sm text-base-content/70 mb-4">
                Tritt auch unserer Signal-Gruppe bei!
              </p>
              <div class="flex flex-col gap-2">
                <a href="#" class="btn btn-primary">Signal-Gruppe beitreten</a>
                <button type="button" class="btn btn-ghost" onClick={closeModal}>Schließen</button>
              </div>
            </div>
          ) : (
            <>
              <h3 class="text-xl font-bold mb-4">Problem melden</h3>
              {error && (
                <div class="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} class="flex flex-col gap-4">
                <div class="form-control">
                  <label class="label" for="title">
                    <span class="label-text">Titel *</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    class="input input-bordered w-full"
                    placeholder="z.B. Fehlender Zebrastreifen"
                  />
                </div>
                <div class="form-control">
                  <label class="label" for="description">
                    <span class="label-text">Beschreibung *</span>
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    required
                    class="textarea textarea-bordered w-full"
                    rows={4}
                    placeholder="Beschreibe das Problem möglichst genau…"
                  />
                </div>
                <div class="form-control">
                  <label class="label" for="location_name">
                    <span class="label-text">Ort *</span>
                  </label>
                  <input
                    type="text"
                    name="location_name"
                    id="location_name"
                    required
                    class="input input-bordered w-full"
                    placeholder="z.B. Kreuzung Krieterstraße / Rotenhäuser Straße"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label" for="latitude">
                      <span class="label-text">Breitengrad</span>
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      id="latitude"
                      step="any"
                      class="input input-bordered w-full"
                      placeholder="53.49"
                    />
                  </div>
                  <div class="form-control">
                    <label class="label" for="longitude">
                      <span class="label-text">Längengrad</span>
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      id="longitude"
                      step="any"
                      class="input input-bordered w-full"
                      placeholder="10.01"
                    />
                  </div>
                </div>
                <p class="text-xs text-base-content/70">
                  Falls du die Koordinaten nicht kennst, lass die Felder leer.
                </p>
                <div class="form-control">
                  <label class="label" for="image_file">
                    <span class="label-text">Foto</span>
                  </label>
                  <input
                    type="file"
                    name="image_file"
                    id="image_file"
                    accept="image/*"
                    class="file-input file-input-bordered w-full"
                  />
                  <label class="label">
                    <span class="label-text-alt">Foto der Gefahrenstelle (max. 5 MB)</span>
                  </label>
                </div>
                <div class="modal-action">
                  <button type="button" class="btn btn-ghost" onClick={closeModal}>Abbrechen</button>
                  <button type="submit" class="btn btn-primary" disabled={loading}>
                    {loading ? 'Wird gesendet…' : 'Absenden'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" onClick={closeModal}>Schließen</button>
        </form>
      </dialog>
    </>
  );
}
