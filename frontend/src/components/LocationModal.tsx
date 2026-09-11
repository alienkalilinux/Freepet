'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { X, MapPin, RefreshCw, Check } from 'lucide-react';
import { POPULAR_CITIES } from '@/lib/cities';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-white/5 border border-white/10 rounded-xl">
      <span className="text-sm text-slate-500">Загрузка карты...</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-400" />
            Ваш город
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'pick' && (
          <>
            <p className="text-sm text-slate-400 mb-4">
              Выберите свой город из списка или определите местоположение автоматически.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handlePickCity(city)}
                  className="px-4 py-2.5 min-h-11 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-primary-400/50 hover:bg-primary-500/10 transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={openMap}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-500 hover:shadow-neon-violet transition-all"
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
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Определён город: <span className="font-semibold ml-1">{detectedCity}</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmDetected}
                    className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors text-sm shadow-neon-emerald"
                  >
                    Подтвердить
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm"
                  >
                    Указать вручную
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
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
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm"
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