import type { ExternalLocationSearchProviderId } from "@/types/locationSearch";

export type PlaceProviderLifecycleState =
  | "active"
  | "temporarily_closed"
  | "permanently_closed"
  | "moved"
  | "replaced";

export type PlaceProviderReferenceRecord = {
  placeId: string;
  provider: ExternalLocationSearchProviderId;
  externalId: string;
  lastVerifiedAt: string | null;
  lifecycleState: PlaceProviderLifecycleState;
  replacementExternalId?: string;
};

export type ProviderReconciliationSignal =
  | "exact-provider-reference"
  | "canonical-place-key"
  | "complete-address-and-postal-code"
  | "coordinate-proximity"
  | "explicit-confirmation";
