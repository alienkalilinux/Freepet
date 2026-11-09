'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Pet, mediaUrl } from '@/lib/api';
import PetPlaceholder from '@/components/PetPlaceholder';

interface PetCardProps {
  pet: Pet;
  priority?: boolean;
}

/** Показываем только исключительные состояния: «ищет дом» — это норма, а не бейдж. */
function statusBadge(status: string) {
  switch (status) {
    case 'booked':
      return <span className="badge badge-amber">Есть заявка</span>;
    case 'transferred':
      return <span className="badge badge-neutral">Передан</span>;
    case 'pending':
      return <span className="badge badge-amber">На проверке</span>;
    case 'rejected':
      return <span className="badge badge-rose">Анкета отклонена</span>;
    default:
      return null;
  }
}

function formatAge(age: number | null) {
  if (age === null) return null;
  const last = age % 10;
  const lastTwo = age % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${age} лет`;
  if (last === 1) return `${age} год`;
  if (last >= 2 && last <= 4) return `${age} года`;
  return `${age} лет`;
}

export default function PetCard({ pet, priority = false }: PetCardProps) {
  const meta = [pet.species, pet.breed].filter(
    (value): value is string =>
      Boolean(value && value.trim() && value !== 'Неизвестно' && !value.toLowerCase().includes('неизвестн'))
  );
  const age = formatAge(pet.age);
  const badge = statusBadge(pet.status);

  return (
    <article className="group surface-card card-focus hover-lift relative flex h-full flex-col overflow-hidden rounded-lg">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
        {pet.image_url ? (
          <img
            src={mediaUrl(pet.image_url)}
            alt={`Фотография питомца ${pet.name}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <PetPlaceholder
            species={pet.species}
            alt={`Фотография питомца ${pet.name}`}
            className="h-full w-full"
          />
        )}
        {badge ? <div className="absolute left-3 top-3">{badge}</div> : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold leading-7 text-content-primary">
          <Link href={`/pet/${pet.id}`} className="after:absolute after:inset-0 after:content-['']">
            {pet.name}
          </Link>
        </h3>

        {meta.length > 0 ? (
          <p className="text-sm leading-5 text-content-secondary">{meta.join(' · ')}</p>
        ) : null}

        {(pet.city || age) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm text-content-muted">
            {pet.city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-content-faint" aria-hidden="true" />
                {pet.city}
              </span>
            ) : null}
            {age ? <span className="tnum">{age}</span> : null}
          </div>
        )}
      </div>
    </article>
  );
}
