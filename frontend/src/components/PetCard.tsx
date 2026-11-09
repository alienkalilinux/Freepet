'use client';

import Link from 'next/link';
import { Pet, mediaUrl } from '@/lib/api';
import PetPlaceholder from '@/components/PetPlaceholder';

interface PetCardProps {
  pet: Pet;
}

function statusBadge(status: string) {
  switch (status) {
    case 'available':
      return <span className="badge badge-leaf">Доступен</span>;
    case 'booked':
      return <span className="badge badge-amber">Забронирован</span>;
    case 'transferred':
      return <span className="badge badge-neutral">Передан</span>;
    case 'pending':
      return <span className="badge badge-amber">Ожидает проверки</span>;
    case 'rejected':
      return <span className="badge badge-rose">Отклонена</span>;
    default:
      return null;
  }
}

export default function PetCard({ pet }: PetCardProps) {
  const meta = [pet.species, pet.breed, pet.city].filter(
    (v): v is string => Boolean(v && v.trim() && v !== 'Неизвестно')
  );

  return (
    <article className="group surface-card hover-lift relative flex h-full flex-col overflow-hidden rounded-xl">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
        <Link href={`/pet/${pet.id}`} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          {pet.image_url ? (
            <img
              src={mediaUrl(pet.image_url)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <PetPlaceholder species={pet.species} alt="" className="h-full w-full" />
          )}
        </Link>
        <div className="absolute left-3 top-3">{statusBadge(pet.status)}</div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[18px] font-semibold leading-7 text-content-primary">
          <Link href={`/pet/${pet.id}`} className="after:absolute after:inset-0 after:content-['']">
            {pet.name}
          </Link>
        </h3>
        <p className="text-sm leading-5 text-content-secondary">
          {meta.length > 0 ? meta.join(' · ') : 'Порода уточняется'}
        </p>
      </div>
    </article>
  );
}
