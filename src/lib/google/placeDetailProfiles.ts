import type { GoogleCapabilities } from "@/types/providerStack";

export type GoogleDetailFeature =
  | "identity"
  | "rating"
  | "openingHours"
  | "photos"
  | "operationalStatus";

export type GoogleExpectedSku =
  | "places-details-essentials"
  | "places-details-pro"
  | "places-details-enterprise";

const fixedFieldProfiles: Record<GoogleDetailFeature, readonly string[]> = {
  identity: ["id", "displayName", "formattedAddress", "location"],
  rating: ["rating", "userRatingCount"],
  openingHours: ["currentOpeningHours", "regularOpeningHours"],
  photos: ["photos"],
  operationalStatus: ["businessStatus", "movedPlace", "movedPlaceId"]
};

export function getEnabledGoogleDetailFields({
  capabilities,
  requestedFeatures
}: {
  capabilities: GoogleCapabilities;
  requestedFeatures: readonly GoogleDetailFeature[];
}) {
  const enabledFeatures = requestedFeatures.filter((feature) => {
    if (feature === "identity") return capabilities.detailsEssentials;
    if (feature === "rating") return capabilities.ratings;
    if (feature === "openingHours") return capabilities.openingHours;
    if (feature === "photos") return capabilities.photos;
    return capabilities.detailsPro;
  });

  return Array.from(new Set(enabledFeatures.flatMap((feature) => fixedFieldProfiles[feature])));
}

export function getExpectedGoogleDetailSkus({
  capabilities,
  requestedFeatures
}: {
  capabilities: GoogleCapabilities;
  requestedFeatures: readonly GoogleDetailFeature[];
}): GoogleExpectedSku[] {
  const skus = new Set<GoogleExpectedSku>();

  requestedFeatures.forEach((feature) => {
    if (feature === "identity" && capabilities.detailsEssentials) {
      skus.add("places-details-essentials");
    }
    if (feature === "operationalStatus" && capabilities.detailsPro) {
      skus.add("places-details-pro");
    }
    if (
      (feature === "rating" && capabilities.ratings) ||
      (feature === "openingHours" && capabilities.openingHours) ||
      (feature === "photos" && capabilities.photos)
    ) {
      skus.add("places-details-enterprise");
    }
  });

  return Array.from(skus);
}
