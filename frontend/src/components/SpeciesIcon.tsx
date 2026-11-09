'use client';

import type { LucideIcon } from 'lucide-react';
import { Bird, Cat, Dog, Fish, PawPrint, Rabbit, Rat, Turtle } from 'lucide-react';

export type SpeciesKey =
  | 'dog'
  | 'cat'
  | 'hamster'
  | 'parrot'
  | 'fish'
  | 'turtle'
  | 'rabbit'
  | 'unknown';

export function getSpeciesKey(species?: string | null): SpeciesKey {
  const s = (species || '').toLowerCase();
  if (s.includes('собак') || s.includes('dog')) return 'dog';
  if (s.includes('кош') || s.includes('кот') || s.includes('cat')) return 'cat';
  if (s.includes('хомяк') || s.includes('hamster')) return 'hamster';
  if (s.includes('попугай') || s.includes('parrot')) return 'parrot';
  if (s.includes('рыбк') || s.includes('fish')) return 'fish';
  if (s.includes('черепах') || s.includes('turtle')) return 'turtle';
  if (s.includes('кролик') || s.includes('rabbit')) return 'rabbit';
  return 'unknown';
}

/** Видовые иконки — Lucide, единый штриховой стиль. */
const SPECIES_ICONS: Record<SpeciesKey, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  hamster: Rat,
  parrot: Bird,
  fish: Fish,
  turtle: Turtle,
  rabbit: Rabbit,
  unknown: PawPrint,
};

interface SpeciesIconProps {
  species?: string | null;
  iconKey?: SpeciesKey;
  className?: string;
}

export default function SpeciesIcon({
  species,
  iconKey,
  className = 'h-14 w-14',
}: SpeciesIconProps) {
  const Icon = SPECIES_ICONS[iconKey ?? getSpeciesKey(species)];
  return <Icon className={className} strokeWidth={1.4} aria-hidden="true" />;
}
