'use client';

import Link from 'next/link';
import { Pet, mediaUrl } from '@/lib/api';
import { Calendar, Heart, MapPin, Shield, AlertTriangle } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const isUnknown =
    pet.species === 'Неизвестно' ||
    !pet.breed ||
    pet.breed.trim() === '' ||
    pet.breed.toLowerCase().includes('неизвестн');

  const getStatusBadge = () => {
    switch (pet.status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-sm">
            Доступен
          </span>
        );
      case 'booked':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
            Забронирован
          </span>
        );
      case 'transferred':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 backdrop-blur-sm">
            Передан
          </span>
        );
      default:
        return null;
    }
  };

  const getSpeciesEmoji = () => {
    const species = pet.species.toLowerCase();
    if (species.includes('собак') || species.includes('dog')) return '🐕';
    if (species.includes('кош') || species.includes('кот') || species.includes('cat')) return '🐈';
    if (species.includes('хомяк') || species.includes('hamster')) return '🐹';
    if (species.includes('попугай') || species.includes('parrot')) return '🦜';
    if (species.includes('рыбк') || species.includes('fish')) return '🐟';
    if (species.includes('черепах') || species.includes('turtle')) return '🐢';
    if (species.includes('кролик') || species.includes('rabbit')) return '🐇';
    return '🐾';
  };

  const ageLabel = (age: number) =>
    age === 1 ? 'год' : age < 5 ? 'года' : 'лет';

  return (
    <Link href={`/pet/${pet.id}`} className="block h-full focus:outline-none">
      <div className="group glass hover:border-primary-500/30 hover:shadow-neon-violet transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col overflow-hidden">
        <div className="relative h-44 sm:h-48 overflow-hidden bg-gradient-to-br from-primary-500/10 via-green-500/5 to-transparent">
          {pet.image_url ? (
            <img
              src={mediaUrl(pet.image_url)}
              alt={pet.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
              {getSpeciesEmoji()}
            </div>
          )}
          <span className="absolute top-2.5 left-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-black/40 backdrop-blur-sm border border-white/10">
            {pet.species}
          </span>
          <div className="absolute top-2.5 right-2.5">{getStatusBadge()}</div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {isUnknown && (
            <div className="mb-2.5 flex items-center space-x-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">Неизвестная порода</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-lg font-bold text-white">{pet.name}</h3>
            <Heart className="h-5 w-5 text-primary-400 group-hover:scale-110 group-hover:text-pink-400 transition-transform" aria-hidden="true" />
          </div>

          {pet.city && (
            <div className="flex items-center text-sm text-slate-400 mb-1.5">
              <MapPin className="h-4 w-4 mr-1.5 text-green-400 flex-shrink-0" />
              <span>{pet.city}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-sm text-slate-400">
            {pet.breed && (
              <p className="truncate">
                <span className="text-slate-500">Порода: </span>{pet.breed}
              </p>
            )}
            {!isUnknown && pet.age !== null && (
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-slate-500 flex-shrink-0" />
                <span>{pet.age} {ageLabel(pet.age)}</span>
              </p>
            )}
          </div>

          {pet.character && (
            <p className="text-sm text-slate-400 mb-2">
              <span className="text-slate-500">Характер: </span>{pet.character}
            </p>
          )}

          <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
            {pet.description}
          </p>

          {pet.vaccination_info && (
            <div className="flex items-center text-sm text-green-400 mb-2 font-medium">
              <Shield className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span>Привит</span>
            </div>
          )}

          {pet.owner && (
            <div className="flex items-center text-xs text-slate-500 mt-auto pt-2.5 border-t border-white/10">
              <span className="truncate">Добавил: {pet.owner.username}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}