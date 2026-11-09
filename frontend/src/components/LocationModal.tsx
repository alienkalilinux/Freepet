'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import UserIcon from '@/components/UserIcon';
import { POPULAR_CITIES } from '@/lib/cities';
import { ActionButton } from '@/components/ui';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="surface-soft flex h-64 items-center justify-center">
      <span className="text-sm text-content-faint">Загрузка карты...</span>
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
    <div className="modal-mask">
      <div className="modal-panel w-full max-w-lg p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="heading-sub flex items-center text-xl">
              <MapPin className="mr-2 h-5 w-5 text-content-muted" />
              Ваш город
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-veil hover:text-content-primary"
            aria-label="Закрыть выбор города"
          >
            <UserIcon name="cross" className="h-5 w-5" />
          </button>
        </div>

        {mode === 'pick' && (
          <>
            <p className="mt-2 text-sm text-content-secondary">
              Выберите свой город из списка или определите местоположение автоматически.
            </p>

            <div className="mb-5 mt-4 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handlePickCity(city)}
                  className="btn btn-secondary btn-sm"
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="border-t border-line pt-4">
              <ActionButton variant="primary" className="btn-lg w-full" onClick={openMap}>
                <RefreshCw className="h-5 w-5" />
                Определить местоположение
              </ActionButton>
            </div>
          </>
        )}

        {mode === 'map' && (
          <>
            {detectedCity ? (
              <div className="alert alert-success mb-4 mt-4">
                <UserIcon name="check" className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">
                  Определён город: <span className="font-medium">{detectedCity}</span>
                </p>
              </div>
            ) : (
              <p className="mb-4 mt-4 text-sm text-content-secondary">
                Кликните на карту в нужном месте (метку можно перетащить), затем нажмите «Подтвердить».
              </p>
            )}

            <div className="surface-soft overflow-hidden p-2">
              <MapPicker
                autoDetect
                onAutoSelect={handleAutoDetect}
                onManualSelect={handleAutoDetect}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {detectedCity && (
                <ActionButton variant="primary" onClick={handleConfirmDetected}>
                  <UserIcon name="check" className="h-5 w-5" />
                  Подтвердить
                </ActionButton>
              )}
              <ActionButton variant="ghost" onClick={handleClose}>
                Указать вручную
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setMode('pick')}>
                Выбрать из списка
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
