export type Coordinates = {
  latitude: number;
  longitude: number;
};

type NumericLike = number | string | { toString: () => string };

type GeofenceInput = {
  session: {
    geofenceLatitude: NumericLike | null;
    geofenceLongitude: NumericLike | null;
    geofenceRadiusMeters: number | null;
  };
  room?: {
    latitude: NumericLike | null;
    longitude: NumericLike | null;
    allowedRadiusMeters: number | null;
  } | null;
};

export type ResolvedAttendanceGeofence = Coordinates & {
  radiusMeters: number;
  source: "session" | "room";
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toNumber(value: NumericLike | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const numberValue =
    typeof value === "number" ? value : Number(value.toString());

  return Number.isFinite(numberValue) ? numberValue : null;
}

function resolveCandidate(
  candidate: {
    latitude: NumericLike | null;
    longitude: NumericLike | null;
    radiusMeters: number | null;
    source: "session" | "room";
  },
): ResolvedAttendanceGeofence | null {
  const latitude = toNumber(candidate.latitude);
  const longitude = toNumber(candidate.longitude);
  const radiusMeters = candidate.radiusMeters;

  if (
    latitude === null ||
    longitude === null ||
    radiusMeters === null ||
    radiusMeters <= 0 ||
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    radiusMeters,
    source: candidate.source,
  };
}

export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function resolveAttendanceGeofence(input: GeofenceInput) {
  return (
    resolveCandidate({
      latitude: input.session.geofenceLatitude,
      longitude: input.session.geofenceLongitude,
      radiusMeters: input.session.geofenceRadiusMeters,
      source: "session",
    }) ??
    resolveCandidate({
      latitude: input.room?.latitude ?? null,
      longitude: input.room?.longitude ?? null,
      radiusMeters: input.room?.allowedRadiusMeters ?? null,
      source: "room",
    })
  );
}

export function calculateDistanceMeters(from: Coordinates, to: Coordinates) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}
