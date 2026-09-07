'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { X, MapPin, RefreshCw, Check } from 'lucide-react';
import { POPULAR_CITIES } from '@/lib/cities';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl border border-gray-200">
      <span className="text-sm text-gray-500">Загрузка карты...</span>
    </div>
  ),
});

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (city: string, coords: [number, number] | null) => void;
  onAutoSelect?: (city: string, coords: [number, number] | null) => void;
}

export default function LocationModal({
  open,
  onClose,
  onSelect,
  onAutoSelect,
}: LocationModalProps) {
  const [mode, setMode] = useState<'pick' | 'map'>('pick');
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [chosenCoords, setChosenCoords] = useState<[number, number] | null>(null);

  if (!open) return null;

  const reset = () => {
    setMode('pick');
    setDetectedCity(null);
    setChosenCoords(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const openMap = () => {
    setMode('map');
    setDetectedCity(null);
    setChosenCoords(null);
  };

  const handleAutoDetect = (city: string, coords: [number, number] | null) => {
    setDetectedCity(city);
    setChosenCoords(coords);
    if (onAutoSelect) {
      // for add-pet: keep modal open so user can confirm manually
      return;
    }
    // for home: apply immediately
    onSelect(city, coords);
    handleClose();
  };

  const handleConfirmDetected = () => {
    if (detectedCity) {
      onSelect(detectedCity, chosenCoords);
      handleClose();
    }
  };

  const handlePickCity = (city: string) => {
    onSelect(city, null);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-600" />
            Ваш город
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'pick' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Выберите свой город из списка или определите местоположение автоматически.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handlePickCity(city)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-primary-50 hover:border-primary-400 transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="border-t pt-4">
              <button
                type="button"
                onClick={openMap}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Определить местоположение
              </button>
            </div>
          </>
        )}

        {mode === 'map' && (
          <>
            {detectedCity ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Определён город: <span className="font-semibold ml-1">{detectedCity}</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmDetected}
                    className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                  >
                    Подтвердить
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    Указать вручную
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">
                Кликните на карту в нужном месте (метку можно перетащить), затем нажмите «Подтвердить».
              </p>
            )}

            <MapPicker
              autoDetect
              onAutoSelect={handleAutoDetect}
              onManualSelect={handleAutoDetect}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setMode('pick')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Выбрать из списка
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}