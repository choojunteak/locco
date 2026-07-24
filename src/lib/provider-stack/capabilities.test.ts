import { describe, expect, it } from "vitest";
import {
  DISABLED_GOOGLE_CAPABILITIES,
  resolveGoogleCapabilities
} from "@/lib/provider-stack/capabilities";

describe("Google capability resolution", () => {
  it("keeps every capability disabled by default", () => {
    expect(
      resolveGoogleCapabilities({
        requested: DISABLED_GOOGLE_CAPABILITIES,
        hasBrowserMapConfiguration: true,
        hasServerCredential: true,
        isKilled: false
      })
    ).toEqual(DISABLED_GOOGLE_CAPABILITIES);
  });

  it("requires browser map configuration for the implemented map capability", () => {
    const requested = { ...DISABLED_GOOGLE_CAPABILITIES, map: true };

    expect(
      resolveGoogleCapabilities({
        requested,
        hasBrowserMapConfiguration: false,
        hasServerCredential: true,
        isKilled: false
      }).map
    ).toBe(false);
    expect(
      resolveGoogleCapabilities({
        requested,
        hasBrowserMapConfiguration: true,
        hasServerCredential: false,
        isKilled: false
      }).map
    ).toBe(true);
  });

  it("does not activate requested capabilities that this build does not implement", () => {
    const resolved = resolveGoogleCapabilities({
      requested: {
        ...DISABLED_GOOGLE_CAPABILITIES,
        detailsEnterprise: true,
        ratings: true,
        photos: true
      },
      hasBrowserMapConfiguration: true,
      hasServerCredential: true,
      isKilled: false
    });

    expect(resolved.detailsEnterprise).toBe(false);
    expect(resolved.ratings).toBe(false);
    expect(resolved.photos).toBe(false);
  });

  it("lets the kill switch shut down even otherwise valid capabilities", () => {
    expect(
      resolveGoogleCapabilities({
        requested: { ...DISABLED_GOOGLE_CAPABILITIES, map: true },
        hasBrowserMapConfiguration: true,
        hasServerCredential: true,
        isKilled: true
      })
    ).toEqual(DISABLED_GOOGLE_CAPABILITIES);
  });

  it("can block opening hours at a usage threshold without disabling the map", () => {
    const resolved = resolveGoogleCapabilities({
      requested: {
        ...DISABLED_GOOGLE_CAPABILITIES,
        map: true,
        openingHours: true
      },
      supported: {
        ...DISABLED_GOOGLE_CAPABILITIES,
        map: true,
        openingHours: true
      },
      hasBrowserMapConfiguration: true,
      hasServerCredential: true,
      isKilled: false,
      operationallyBlocked: {
        openingHours: true
      }
    });

    expect(resolved.map).toBe(true);
    expect(resolved.openingHours).toBe(false);
  });
});
