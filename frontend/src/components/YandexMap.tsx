'use client';

import { useState, useEffect } from 'react';
import { YMaps, Map, Placemark, useYMaps } from '@pbe/react-yandex-maps';
import { MapPin } from 'lucide-react';
import { forwardGeocodeCity } from '@/lib/ymapsUtils';

const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY;

interface MapContentProps {
  city: string;
}

function MapContent({ city }: MapContentProps) {
  const ymaps = useYMaps(['geocode']);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!city || coords) return;
    let cancelled = false;

    const run = async () => {
      const pos = await forwardGeocodeCity(ymaps, city);
      if (!cancelled) {
        if (pos) {
          setCoords(pos);
        } else {
          setError(true);
        }
      }
    };

    if (ymaps) run();

    return () => {
      cancelled = true;
    };
  }, [ymaps, city, coords]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-gray-500">
        <MapPin className="h-4 w-4 mr-2" />
        Не удалось определить расположение: {city}
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-gray-500">
        <MapPin className="h-4 w-4 mr-2" />
        Определяем расположение...
      </div>
    );
  }

  return (
    <Map
      defaultState={{ center: coords, zoom: 13 }}
      style={{ width: '100%', height: '340px', borderRadius: '0.75rem' }}
    >
      <Placemark
        geometry={coords}
        properties={{
          hintContent: city,
          balloonContent: city,
        }}
      />
    </Map>
  );
}

export default function YandexMap({ city }: { city: string }) {
  if (!API_KEY) return null;

  return (
    <YMaps query={{ apikey: API_KEY, lang: 'ru_RU', load: 'package.full' }}>
      <MapContent city={city} />
    </YMaps>
  );
}