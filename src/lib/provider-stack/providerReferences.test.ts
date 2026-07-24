import { describe, expect, it } from "vitest";
import {
  PROVIDER_RECONCILIATION_ORDER,
  providerReferenceUniqueKey
} from "@/lib/provider-stack/providerReferences";

describe("future provider reference boundary", () => {
  it("namespaces external identity by provider for future unique(provider, external_id)", () => {
    expect(providerReferenceUniqueKey("google", "outlet-123")).toBe("google:outlet-123");
    expect(providerReferenceUniqueKey("onemap", "outlet-123")).toBe("onemap:outlet-123");
  });

  it("does not treat matching chain names as reconciliation evidence", () => {
    expect(PROVIDER_RECONCILIATION_ORDER).toEqual([
      "exact-provider-reference",
      "canonical-place-key",
      "complete-address-and-postal-code",
      "coordinate-proximity",
      "explicit-confirmation"
    ]);
    expect(PROVIDER_RECONCILIATION_ORDER).not.toContain("display-name");
  });
});
