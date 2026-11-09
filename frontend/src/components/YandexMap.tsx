'use client';

import { useState, useEffect } from 'react';
import { YMaps, Map, Placemark, useYMaps } from '@pbe/react-yandex-maps';
import { MapPin } from 'lucide-react';
import { forwardGeocodeCity } from '@/lib/ymapsUtils';
import { useConsent } from '@/lib/consent';
import MapConsentNotice from '@/components/MapConsentNotice';

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
      <div className="alert alert-warning">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">Не удалось определить расположение: {city}</span>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="surface-soft flex h-24 items-center justify-center text-sm text-content-muted">
        <MapPin className="mr-2 h-4 w-4 text-accent-text" />
        Определяем расположение...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <Map
        defaultState={{ center: coords, zoom: 13 }}
        style={{ width: '100%', height: '340px', borderRadius: '1rem' }}
      >
        <Placemark
          geometry={coords}
          properties={{
            hintContent: city,
            balloonContent: city,
          }}
        />
      </Map>
    </div>
  );
}

export default function YandexMap({ city }: { city: string }) {
  const allowed = useConsent('external');
  if (!API_KEY) return null;
  if (!allowed) return <MapConsentNotice />;

  return (
    <YMaps query={{ apikey: API_KEY, lang: 'ru_RU', load: 'package.full' }}>
      <MapContent city={city} />
    </YMaps>
  );
}
