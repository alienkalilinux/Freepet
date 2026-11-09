'use client';

import dynamic from 'next/dynamic';
import { Pet } from '@/lib/api';

const YandexMap = dynamic(() => import('@/components/YandexMap'), {
  ssr: false,
  loading: () => (
    <div className="surface-soft flex h-72 items-center justify-center rounded-2xl">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent-line border-t-transparent" aria-hidden="true" />
    </div>
  ),
});

export default function PetMap({ pet }: { pet: Pet }) {
  if (!pet.city) return null;
  return <YandexMap city={pet.city} />;
}
