import { describe, expect, it } from "vitest";
import type { MergedPlace } from "@/types";
import { composePlaceDetailViewModel } from "@/lib/place-details/composePlaceDetailViewModel";

const canonicalPlace: MergedPlace = {
  id: "locco-place-1",
  name: "Example Noodle House",
  address: "1 Example Road, Singapore 018989",
  postalCode: "018989",
  latitude: 1.29,
  longitude: 103.85,
  categories: ["Local"],
  moodTags: ["Comfort Food"],
  priceRange: "$$",
  sources: [],
  notes: "Trusted-list note",
  personalNote: "Order the dry noodles",
  comments: [{ author: "Friend", text: "Go before lunch." }],
  savedBy: ["You", "Friend"],
  savedBySelected: ["Friend"],
  listIds: ["list-1"],
  selectedListIds: ["list-1"],
  status: "visited",
  rating: 5
};

describe("provider-aware place detail view model", () => {
  it("keeps personal and Locco-owned data distinct when no provider reference exists", () => {
    const viewModel = composePlaceDetailViewModel({
      place: canonicalPlace,
      isSaved: true
    });

    expect(viewModel.canonicalPlaceId).toBe("locco-place-1");
    expect(viewModel.personal).toEqual({
      isSaved: true,
      status: "visited",
      note: "Order the dry noodles",
      rating: 5
    });
    expect(viewModel.locco.notes).toBe("Trusted-list note");
    expect(viewModel.providerDetails.status).toBe("disabled");
    expect(viewModel.media).toEqual({
      loccoPhotos: [],
      providerPhotoReferences: [],
      fallback: "placeholder"
    });
  });

  it("labels Google rating data independently from personal rating", () => {
    const viewModel = composePlaceDetailViewModel({
      place: canonicalPlace,
      isSaved: true,
      googleDetails: {
        source: "google",
        externalReference: { provider: "google", id: "ChIJExample" },
        rating: { value: 4.3, count: 128 },
        attributionLabel: "Google Maps"
      }
    });

    expect(viewModel.personal.rating).toBe(5);
    expect(viewModel.providerDetails.status).toBe("ready");
    if (viewModel.providerDetails.status === "ready") {
      expect(viewModel.providerDetails.data.rating).toEqual({ value: 4.3, count: 128 });
      expect(viewModel.providerDetails.data.attributionLabel).toBe("Google Maps");
    }
  });
});
