'use client';

import dynamic from 'next/dynamic';
import { Pet } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const YandexMap = dynamic(() => import('@/components/YandexMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-72 rounded-xl bg-white/5 border border-white/10">
      <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
    </div>
  ),
});

export default function PetMap({ pet }: { pet: Pet }) {
  if (!pet.city) return null;
  return <YandexMap city={pet.city} />;
}