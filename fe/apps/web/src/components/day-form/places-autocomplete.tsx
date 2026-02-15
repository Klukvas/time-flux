'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useTranslation } from '@lifespan/hooks';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: { lat: number; lng: number; name: string }) => void;
  disabled?: boolean;
}

interface Suggestion {
  placeId: string;
  text: string;
  placePrediction: google.maps.places.PlacePrediction;
}

export function PlacesAutocomplete({ onPlaceSelect, disabled }: PlacesAutocompleteProps) {
  const { t } = useTranslation();
  const places = useMapsLibrary('places');
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Create session token when places library loads
  useEffect(() => {
    if (!places) return;
    sessionTokenRef.current = new places.AutocompleteSessionToken();
  }, [places]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim() || !places) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const { suggestions: results } =
            await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
              input: value,
              sessionToken: sessionTokenRef.current ?? undefined,
            });

          const mapped: Suggestion[] = results
            .filter((s) => s.placePrediction)
            .map((s) => ({
              placeId: s.placePrediction!.placeId,
              text: s.placePrediction!.text.text,
              placePrediction: s.placePrediction!,
            }));

          setSuggestions(mapped);
          setOpen(mapped.length > 0);
        } catch {
          setSuggestions([]);
          setOpen(false);
        }
      }, 300);
    },
    [places],
  );

  const handleSelect = useCallback(
    async (suggestion: Suggestion) => {
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['location', 'displayName', 'formattedAddress'],
        });

        if (!place.location) return;

        onPlaceSelect({
          lat: place.location.lat(),
          lng: place.location.lng(),
          name: place.formattedAddress ?? place.displayName ?? suggestion.text,
        });
        setInput(suggestion.text);
        setSuggestions([]);
        setOpen(false);

        // Start a new session for the next search
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      } catch {
        // ignore errors
      }
    },
    [onPlaceSelect],
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={t('day_form.search_location')}
        className="block w-full rounded-lg border border-edge bg-surface-card px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        disabled={disabled}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-edge bg-surface-card shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s.placeId}
              onClick={() => handleSelect(s)}
              className="cursor-pointer px-3 py-2 text-sm text-content hover:bg-surface-secondary"
            >
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
