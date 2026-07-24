import { describe, expect, it } from "vitest";
import type { GoogleCapabilities } from "@/types";
import {
  getEnabledGoogleDetailFields,
  getExpectedGoogleDetailSkus
} from "@/lib/google/placeDetailProfiles";

const disabled: GoogleCapabilities = {
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

describe("cost-aware Google detail field profiles", () => {
  it("returns no fields while all paid capabilities are disabled", () => {
    expect(
      getEnabledGoogleDetailFields({
        capabilities: disabled,
        requestedFeatures: ["identity", "rating", "openingHours", "photos"]
      })
    ).toEqual([]);
  });

  it("gates ratings, hours, and photos independently", () => {
    const fields = getEnabledGoogleDetailFields({
      capabilities: {
        ...disabled,
        ratings: true,
        openingHours: false,
        photos: true
      },
      requestedFeatures: ["rating", "openingHours", "photos"]
    });

    expect(fields).toEqual(["rating", "userRatingCount", "photos"]);
    expect(fields).not.toContain("currentOpeningHours");
  });

  it("uses fixed profiles rather than accepting arbitrary Google fields", () => {
    expect(
      getEnabledGoogleDetailFields({
        capabilities: { ...disabled, detailsEssentials: true, detailsPro: true },
        requestedFeatures: ["identity", "operationalStatus"]
      })
    ).toEqual([
      "id",
      "displayName",
      "formattedAddress",
      "location",
      "businessStatus",
      "movedPlace",
      "movedPlaceId"
    ]);
  });

  it("labels expected SKUs without claiming actual billed usage", () => {
    expect(
      getExpectedGoogleDetailSkus({
        capabilities: {
          ...disabled,
          detailsEssentials: true,
          openingHours: true
        },
        requestedFeatures: ["identity", "openingHours"]
      })
    ).toEqual(["places-details-essentials", "places-details-enterprise"]);
  });
});
