import type { ValidatedCoordinates } from "@/types";

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  if (typeof value === "string" && !value.trim()) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function toValidatedCoordinates(
  latitudeValue: unknown,
  longitudeValue: unknown
): ValidatedCoordinates | null {
  const latitude = toFiniteNumber(latitudeValue);
  const longitude = toFiniteNumber(longitudeValue);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}
