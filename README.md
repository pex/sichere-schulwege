# Elterninitiative Sichere Schulwege Wilhelmsburg

Website der Elterninitiative für sichere Schulwege in Hamburg-Wilhelmsburg, mit Fokus auf die Elbinselschule (Standorte Rahmwerder und Krieterstraße).

## Starten

```bash
npm install
npm run dev      # Entwicklungsserver auf http://localhost:4321
npm run build    # Produktions-Build
npm run start    # Produktionsserver starten (nach Build)
```

## Tech-Stack

- **Astro** (SSR mit Node-Adapter)
- **Tailwind CSS v4** + **DaisyUI v5**
- **Preact** für interaktive Komponenten (Islands)
- **SQLite** (better-sqlite3) für Problemmeldungen und Kommentare

## Datenbank

Die SQLite-Datenbank (`data.db`) wird beim ersten Serverstart automatisch erstellt und mit Beispieldaten befüllt. Löschen Sie die Datei, um die Datenbank zurückzusetzen.

## Platzhalter ausfüllen

Folgende Stellen müssen vor dem produktiven Einsatz angepasst werden:

- **`src/pages/impressum.astro`**: Name, Adresse, E-Mail-Adresse eintragen
- **`src/pages/datenschutz.astro`**: Verantwortlichen, Hosting-Anbieter, Kontaktdaten eintragen
- **`src/components/SignalCTA.astro`**: Signal-Gruppen-Link (`href="#"`) durch echten Einladungslink ersetzen
- **`src/components/Footer.astro`**: Signal-Gruppen-Link anpassen
- **`src/components/PartnerLogos.astro`**: Platzhalter durch echte Partner-Logos ersetzen
- **`Vorher/Nachher-Bilder`**: Die SVG-Platzhalter in `public/images/` durch echte Fotos ersetzen

## Struktur

```
src/
├── components/     Astro- und Preact-Komponenten
├── layouts/        BaseLayout mit Header/Footer
├── lib/            Datenbank-Layer (db.ts)
├── pages/          Seiten und API-Endpunkte
│   ├── api/        POST-Endpunkte für Meldungen/Kommentare
│   ├── probleme/   Problemliste, Detailseiten, Meldeformular
│   ├── impressum   Impressum
│   └── datenschutz Datenschutzerklärung
└── styles/         Globales CSS mit Tailwind + DaisyUI Theme
```

## Moderation

Eingereichte Problemmeldungen und Kommentare sind standardmäßig nicht sichtbar (`is_approved = 0`). Um sie freizuschalten, setzen Sie `is_approved = 1` direkt in der SQLite-Datenbank (z.B. mit einem SQLite-Client).
