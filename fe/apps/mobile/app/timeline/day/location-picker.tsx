import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { MapPressEvent, Region } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import { useTranslation, useUpdateDayLocation } from '@lifespan/hooks';
import { MAX_LOCATION_NAME_LENGTH } from '@lifespan/constants';
import { colors, fontSize, spacing, borderRadius } from '@/lib/theme';

// TODO: Move to app config / Constants.expoConfig
const GOOGLE_MAPS_API_KEY = 'GOOGLE_MAPS_API_KEY';

const DEFAULT_REGION: Region = {
  latitude: 48.4647,
  longitude: 35.0462,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

export default function LocationPickerScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    date,
    lat: initLat,
    lng: initLng,
    name: initName,
  } = useLocalSearchParams<{
    date: string;
    lat?: string;
    lng?: string;
    name?: string;
  }>();

  const updateLocation = useUpdateDayLocation();
  const mapRef = useRef<MapView>(null);

  const hasInitial = initLat != null && initLng != null;
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(
    hasInitial ? { latitude: parseFloat(initLat!), longitude: parseFloat(initLng!) } : null,
  );
  const [locationName, setLocationName] = useState(initName ?? '');
  const [detecting, setDetecting] = useState(false);

  const initialRegion: Region = hasInitial
    ? {
        latitude: parseFloat(initLat!),
        longitude: parseFloat(initLng!),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_REGION;

  const handleMapPress = useCallback(async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });

    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        const parts = [geo.city, geo.region, geo.country].filter(Boolean);
        setLocationName(
          parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        );
      } else {
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch {
      setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  }, []);

  const handleCurrentLocation = useCallback(async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('', t('day_form.location_permission_denied'));
        setDetecting(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setMarker({ latitude, longitude });
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500,
      );

      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo) {
          const parts = [geo.city, geo.region, geo.country].filter(Boolean);
          setLocationName(
            parts.length > 0
              ? parts.join(', ')
              : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          );
        }
      } catch {
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch {
      Alert.alert('', t('day_form.location_unavailable'));
    } finally {
      setDetecting(false);
    }
  }, [t]);

  const handleSave = () => {
    if (!locationName.trim() || !marker) return;
    updateLocation.mutate(
      {
        date: date!,
        data: {
          locationName: locationName.trim(),
          latitude: marker.latitude,
          longitude: marker.longitude,
        },
      },
      {
        onSuccess: () => router.back(),
        onError: (err) => Alert.alert('Error', getUserMessage(extractApiError(err))),
      },
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('day_form.location_modal_title'),
          presentation: 'modal',
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder={t('day_form.search_location')}
            onPress={(_data, details) => {
              if (details?.geometry?.location) {
                const { lat, lng } = details.geometry.location;
                setMarker({ latitude: lat, longitude: lng });
                setLocationName(details.formatted_address ?? _data.description);
                mapRef.current?.animateToRegion(
                  { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
                  500,
                );
              }
            }}
            query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
            fetchDetails
            enablePoweredByContainer={false}
            styles={{
              textInput: styles.searchInput,
              listView: styles.searchList,
              row: styles.searchRow,
              description: styles.searchDescription,
            }}
          />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {marker && <Marker coordinate={marker} />}
          </MapView>

          {/* Hint overlay */}
          {!marker && (
            <View style={styles.hintOverlay}>
              <Text style={styles.hintText}>{t('day_form.tap_to_place_pin')}</Text>
            </View>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.controls}>
          {/* Current location */}
          <Pressable
            onPress={handleCurrentLocation}
            disabled={detecting}
            style={styles.currentLocationBtn}
          >
            {detecting ? (
              <ActivityIndicator size="small" color={colors.brand[500]} />
            ) : (
              <Text style={styles.currentLocationText}>{t('day_form.use_current_location')}</Text>
            )}
          </Pressable>

          {/* Location name (editable) */}
          {marker && (
            <View style={styles.nameRow}>
              <TextInput
                value={locationName}
                onChangeText={setLocationName}
                maxLength={MAX_LOCATION_NAME_LENGTH}
                placeholder={t('day_form.location_name')}
                placeholderTextColor={colors.gray[400]}
                style={styles.nameInput}
              />
              <Text style={styles.coordsText}>
                {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!locationName.trim() || !marker || updateLocation.isPending}
              style={[
                styles.saveBtn,
                (!locationName.trim() || !marker) && styles.saveBtnDisabled,
              ]}
            >
              {updateLocation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>{t('common.save')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Search
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.gray[900],
    backgroundColor: colors.white,
    height: 44,
  },
  searchList: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    marginTop: 4,
  },
  searchRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
  },

  // Map
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  hintOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },

  // Controls
  controls: {
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  currentLocationBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
  },
  currentLocationText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.brand[500],
  },
  nameRow: {
    gap: 4,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  coordsText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
  },
  cancelText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand[500],
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#fff',
  },
});
