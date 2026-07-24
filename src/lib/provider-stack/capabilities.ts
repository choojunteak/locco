import type {
  GoogleCapabilities,
  GoogleCapabilityId
} from "@/types/providerStack";

export const DISABLED_GOOGLE_CAPABILITIES: GoogleCapabilities = {
  map: false,
  autocomplete: false,
  textSearch: false,
  nearbySearch: false,
  detailsEssentials: false,
  detailsPro: false,
  detailsEnterprise: false,
  ratings: false,
  openingHours: false,
  photos: false,
  geocoding: false,
  routes: false,
  placeReconciliation: false
};

export const GOOGLE_BUILD_SUPPORTED_CAPABILITIES: GoogleCapabilities = {
  ...DISABLED_GOOGLE_CAPABILITIES,
  map: true
};

export function resolveGoogleCapabilities({
  requested,
  supported = GOOGLE_BUILD_SUPPORTED_CAPABILITIES,
  hasBrowserMapConfiguration,
  hasServerCredential,
  isKilled,
  operationallyBlocked = {}
}: {
  requested: GoogleCapabilities;
  supported?: GoogleCapabilities;
  hasBrowserMapConfiguration: boolean;
  hasServerCredential: boolean;
  isKilled: boolean;
  operationallyBlocked?: Partial<Record<GoogleCapabilityId, boolean>>;
}): GoogleCapabilities {
  return Object.fromEntries(
    (Object.keys(DISABLED_GOOGLE_CAPABILITIES) as GoogleCapabilityId[]).map(
      (capability) => {
        const hasRequiredCredential =
          capability === "map" ? hasBrowserMapConfiguration : hasServerCredential;

        return [
          capability,
          !isKilled &&
            !operationallyBlocked[capability] &&
            requested[capability] &&
            supported[capability] &&
            hasRequiredCredential
        ];
      }
    )
  ) as GoogleCapabilities;
}
