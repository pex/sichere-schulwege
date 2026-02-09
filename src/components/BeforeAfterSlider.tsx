import { useState, useRef, useCallback } from 'preact/hooks';

interface Props {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Vorher',
  afterLabel = 'Nachher',
}: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback((e: PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      class="relative w-full aspect-[4/3] overflow-hidden rounded-lg select-none touch-none cursor-col-resize"
      role="slider"
      aria-label="Vorher-Nachher-Vergleich"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* After image (full background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        class="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* After label (clipped to right of slider) */}
      <div
        class="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <span class="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {afterLabel}
        </span>
      </div>
      {/* Before image (clipped to left of slider) */}
      <div
        class="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          class="w-full h-full object-cover"
          draggable={false}
        />
        <span class="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {beforeLabel}
        </span>
      </div>
      {/* Slider handle */}
      <div
        class="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary -ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
