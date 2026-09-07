'use client';

import { useState, useEffect, useCallback } from 'react';
import { YMaps, Map, Placemark, useYMaps } from '@pbe/react-yandex-maps';
import { Loader2, Crosshair, MapPin } from 'lucide-react';
import { reverseGeocodeCity } from '@/lib/ymapsUtils';

const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY;
const DEFAULT_CENTER: [number, number] = [43.2424, 76.9072];

interface MapPickerProps {
  autoDetect?: boolean;
  onAutoSelect?: (city: string, coords: [number, number]) => void;
  onManualSelect: (city: string, coords: [number, number]) => void;
  onDetectFailed?: () => void;
}

function MapInteractive({
  autoDetect,
  onAutoSelect,
  onManualSelect,
  onDetectFailed,
}: MapPickerProps) {
  const ymaps = useYMaps(['geocode']);
  const [coords, setCoords] = useState<[number, number]>(DEFAULT_CENTER);
  const [chosen, setChosen] = useState<[number, number] | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const detectLocation = useCallback(async () => {
    if (!ymaps || typeof navigator === 'undefined' || !navigator.geolocation) {
      onDetectFailed?.();
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCoords(c);
        setChosen(c);
        const city = await reverseGeocodeCity(ymaps, c);
        setDetecting(false);
        if (city) {
          onAutoSelect?.(city, c);
        } else {
          onDetectFailed?.();
        }
      },
      () => {
        setDetecting(false);
        onDetectFailed?.();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, [ymaps, onAutoSelect, onDetectFailed]);

  useEffect(() => {
    if (ymaps && autoDetect) {
      detectLocation();
    }
  }, [ymaps, autoDetect, detectLocation]);

  const handleMapClick = (e: any) => {
    const c = e?.get?.('coords');
    if (c && Array.isArray(c) && c.length === 2) {
      setCoords([c[0], c[1]]);
      setChosen([c[0], c[1]]);
      setResolveError('');
    }
  };

  const handleDragEnd = (e: any) => {
    const c = e?.get?.('target')?.geometry?.getCoordinates?.();
    if (c && Array.isArray(c) && c.length === 2) {
      setCoords([c[0], c[1]]);
      setChosen([c[0], c[1]]);
      setResolveError('');
    }
  };

  const confirm = async () => {
    if (!chosen || !ymaps || resolving) return;
    setResolving(true);
    setResolveError('');
    const city = await reverseGeocodeCity(ymaps, chosen);
    setResolving(false);
    if (city) {
      onManualSelect(city, chosen);
    } else {
      setResolveError('Не удалось определить город рядом с этой точкой');
    }
  };

  if (!ymaps) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 rounded-xl border border-gray-200">
        <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {detecting && (
        <div className="mb-3 flex items-center text-sm text-primary-700 bg-primary-50 rounded-lg px-3 py-2">
          <Crosshair className="h-4 w-4 mr-2 animate-pulse" />
          Определяем ваше местоположение...
        </div>
      )}

      <Map
        {...({
          state: { center: coords },
          onClick: handleMapClick,
          style: { width: '100%', height: '320px', borderRadius: '0.75rem' },
        } as any)}
      >
        {chosen && (
          <Placemark
            {...({
              geometry: chosen,
              options: { draggable: true },
              onDragEnd: handleDragEnd,
              properties: { hintContent: 'Ваша точка' },
            } as any)}
          />
        )}
      </Map>

      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <button
          type="button"
          onClick={detectLocation}
          disabled={!!detecting}
          className="flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50"
        >
          <Crosshair className="h-4 w-4 mr-1" />
          {detecting ? 'Определяем...' : 'Определить автоматически'}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!chosen || resolving}
          className="flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resolving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          Подтвердить
        </button>
      </div>
      {resolveError && (
        <p className="mt-2 text-sm text-red-600">{resolveError}</p>
      )}
    </div>
  );
}

export default function MapPicker(props: MapPickerProps) {
  if (!API_KEY) return null;

  return (
    <YMaps query={{ apikey: API_KEY, lang: 'ru_RU', load: 'package.full' }}>
      <MapInteractive {...props} />
    </YMaps>
  );
}