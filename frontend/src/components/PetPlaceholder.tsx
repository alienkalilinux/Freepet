'use client';

import SpeciesIcon, { getSpeciesKey } from '@/components/SpeciesIcon';

interface PetPlaceholderProps {
  species?: string | null;
  alt?: string;
  className?: string;
}

/** Тёплая медаль-плейсхолдер: видовая иконка Lucide вместо символов ember-atlas. */
export default function PetPlaceholder({ species, alt, className }: PetPlaceholderProps) {
  return (
    <div
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`relative flex items-center justify-center overflow-hidden bg-surface-sunken ${
        className ?? 'h-full w-full'
      }`}
    >
      <span
        className="absolute aspect-square h-[62%] max-h-56 rounded-full bg-accent-soft"
        aria-hidden="true"
      />
      <SpeciesIcon
        iconKey={getSpeciesKey(species)}
        className="relative h-[30%] w-[30%] text-accent-text"
      />
    </div>
  );
}
