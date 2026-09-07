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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Доступен
          </span>
        );
      case 'booked':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Забронирован
          </span>
        );
      case 'transferred':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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

  return (
    <Link href={`/pet/${pet.id}`}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col">
        <div className="relative h-48 bg-gray-200">
          {pet.image_url ? (
            <img
              src={mediaUrl(pet.image_url)}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {getSpeciesEmoji()}
            </div>
          )}
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {isUnknown && (
            <div className="mb-2 flex items-center space-x-2 text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">Неизвестная порода</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
            <span className="text-2xl">{getSpeciesEmoji()}</span>
          </div>

          <p className="text-sm text-gray-500 mb-2">{pet.species}</p>

          {pet.city && (
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <MapPin className="h-4 w-4 mr-1 text-primary-500" />
              <span>{pet.city}</span>
            </div>
          )}

          {pet.breed && (
            <p className="text-sm text-gray-600 mb-1">
              <span className="text-gray-400">Порода: </span>{pet.breed}
            </p>
          )}

          {pet.character && (
            <p className="text-sm text-gray-600 mb-1">
              <span className="text-gray-400">Характер: </span>{pet.character}
            </p>
          )}

          {!isUnknown && pet.age !== null && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{pet.age} {pet.age === 1 ? 'год' : pet.age < 5 ? 'года' : 'лет'}</span>
            </div>
          )}

          <p className="text-gray-700 text-sm line-clamp-2 mb-3 flex-1">
            {pet.description}
          </p>

          {pet.vaccination_info && (
            <div className="flex items-center text-sm text-green-600 mb-2">
              <Shield className="h-4 w-4 mr-1" />
              <span>Привит</span>
            </div>
          )}

          {pet.owner && (
            <div className="flex items-center text-xs text-gray-500 mt-auto pt-2 border-t">
              <span>Добавил: {pet.owner.username}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
