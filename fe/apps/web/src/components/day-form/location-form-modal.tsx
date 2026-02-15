'use client';

import { useCallback, useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { useTranslation } from '@lifespan/hooks';
import { MAX_LOCATION_NAME_LENGTH } from '@lifespan/constants';
import { reverseGeocode } from '@lifespan/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { PlacesAutocomplete } from './places-autocomplete';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? '';
const DEFAULT_CENTER = { lat: 48.4647, lng: 35.0462 };
const DEFAULT_ZOOM = 4;

interface LocationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { locationName: string; latitude?: number; longitude?: number }) => void;
  saving: boolean;
  initialName?: string;
  initialLat?: number;
  initialLng?: number;
}

function MapPanner({ target }: { target: google.maps.LatLngLiteral | null }) {
  const map = useMap();
  useEffect(() => {
    if (target && map) {
      map.panTo(target);
      map.setZoom(15);
    }
  }, [target, map]);
  return null;
}

export function LocationFormModal({
  open,
  onClose,
  onSave,
  saving,
  initialName = '',
  initialLat,
  initialLng,
}: LocationFormModalProps) {
  const { t } = useTranslation();

  const hasInitialCoords = initialLat != null && initialLng != null;
  const initialCenter = hasInitialCoords
    ? { lat: initialLat, lng: initialLng }
    : DEFAULT_CENTER;
  const initialZoom = hasInitialCoords ? 15 : DEFAULT_ZOOM;

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    hasInitialCoords ? { lat: initialLat, lng: initialLng } : null,
  );
  // panTarget is set only by geolocation/autocomplete (not map clicks) to trigger map panning
  const [panTarget, setPanTarget] = useState<google.maps.LatLngLiteral | null>(null);
  const [name, setName] = useState(initialName);
  const [detecting, setDetecting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal reopens with different props
  useEffect(() => {
    if (open) {
      const hasCoords = initialLat != null && initialLng != null;
      setMarkerPosition(hasCoords ? { lat: initialLat!, lng: initialLng! } : null);
      setPanTarget(null);
      setName(initialName);
      setError('');
    }
  }, [open, initialName, initialLat, initialLng]);

  const handleMapClick = useCallback(async (e: MapMouseEvent) => {
    const latLng = e.detail.latLng;
    if (!latLng) return;
    const { lat, lng } = latLng;

    setMarkerPosition({ lat, lng });
    setError('');
    setGeocoding(true);

    const result = await reverseGeocode(lat, lng, API_KEY);
    if (result) {
      setName(result.locationName);
    } else {
      setName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
    setGeocoding(false);
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(t('day_form.location_unavailable'));
      return;
    }
    setDetecting(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        setMarkerPosition(pos);
        setPanTarget(pos);

        const result = await reverseGeocode(latitude, longitude, API_KEY);
        if (result) setName(result.locationName);
        else setName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? t('day_form.location_permission_denied')
            : t('day_form.location_unavailable'),
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [t]);

  const handlePlaceSelect = useCallback((place: { lat: number; lng: number; name: string }) => {
    const pos = { lat: place.lat, lng: place.lng };
    setMarkerPosition(pos);
    setPanTarget(pos);
    setName(place.name);
    setError('');
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      locationName: name.trim(),
      latitude: markerPosition?.lat,
      longitude: markerPosition?.lng,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={t('day_form.location_modal_title')} size="lg">
      <APIProvider apiKey={API_KEY}>
        <div className="space-y-3">
          {/* Places search */}
          <PlacesAutocomplete onPlaceSelect={handlePlaceSelect} disabled={saving} />

          {/* Map */}
          <div className="relative h-[350px] w-full overflow-hidden rounded-lg border border-edge">
            <Map
              defaultCenter={initialCenter}
              defaultZoom={initialZoom}
              mapId={MAP_ID}
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
              onClick={handleMapClick}
              className="h-full w-full"
            >
              {markerPosition && <AdvancedMarker position={markerPosition} />}
              <MapPanner target={panTarget} />
            </Map>
          </div>

          {/* Hint text */}
          {!markerPosition && (
            <p className="text-center text-xs text-content-tertiary">
              {t('day_form.tap_to_place_pin')}
            </p>
          )}

          {/* Current location button */}
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleUseCurrentLocation}
            loading={detecting}
            disabled={saving}
          >
            {detecting ? t('day_form.detecting_location') : t('day_form.use_current_location')}
          </Button>

          {error && <p className="text-xs text-danger">{error}</p>}

          {/* Selected location — editable name + coords */}
          {markerPosition && (
            <div>
              <label className="mb-1 block text-sm font-medium text-content-secondary">
                {t('day_form.location_name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_LOCATION_NAME_LENGTH}
                className="block w-full rounded-lg border border-edge bg-surface-card px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={saving || geocoding}
              />
              <p className="mt-1 text-xs text-content-tertiary">
                {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} loading={saving} disabled={!name.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </APIProvider>
    </Modal>
  );
}
