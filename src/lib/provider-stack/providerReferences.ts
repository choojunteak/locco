import type {
  ExternalLocationSearchProviderId,
  ProviderReconciliationSignal
} from "@/types";

export const PROVIDER_RECONCILIATION_ORDER: readonly ProviderReconciliationSignal[] = [
  "exact-provider-reference",
  "canonical-place-key",
  "complete-address-and-postal-code",
  "coordinate-proximity",
  "explicit-confirmation"
];

export function providerReferenceUniqueKey(
  provider: ExternalLocationSearchProviderId,
  externalId: string
) {
  return `${provider}:${externalId}`;
}
