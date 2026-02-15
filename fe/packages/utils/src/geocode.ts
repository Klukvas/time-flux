export interface ReverseGeocodeResult {
  locationName: string;
  city?: string;
  country?: string;
  formattedAddress?: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  apiKey: string,
  language = 'en',
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=${language}`,
    );
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    const components = data.results[0].address_components as Array<{
      long_name: string;
      types: string[];
    }>;
    const city =
      components.find((c: { types: string[] }) => c.types.includes('locality'))?.long_name ??
      components.find((c: { types: string[] }) => c.types.includes('administrative_area_level_1'))
        ?.long_name;
    const country = components.find((c: { types: string[] }) =>
      c.types.includes('country'),
    )?.long_name;
    const parts = [city, country].filter(Boolean);
    const locationName =
      parts.length > 0 ? parts.join(', ') : data.results[0].formatted_address;

    return {
      locationName,
      city: city ?? undefined,
      country: country ?? undefined,
      formattedAddress: data.results[0].formatted_address,
    };
  } catch {
    return null;
  }
}
