import type { MergedPlace } from "@/types";
import type {
  GoogleProviderPlaceDetails,
  PlaceDetailViewModel
} from "@/types/placeDetails";

export function composePlaceDetailViewModel({
  place,
  isSaved,
  googleDetails,
  googleDetailsEnabled = false
}: {
  place: MergedPlace;
  isSaved: boolean;
  googleDetails?: GoogleProviderPlaceDetails;
  googleDetailsEnabled?: boolean;
}): PlaceDetailViewModel {
  return {
    canonicalPlaceId: place.id,
    identity: {
      name: place.name,
      address: place.address,
      categories: place.categories
    },
    media: {
      loccoPhotos: [],
      providerPhotoReferences: googleDetails?.photoReferences ?? [],
      fallback: "placeholder"
    },
    locco: {
      notes: place.notes,
      tags: [...place.categories, ...place.moodTags],
      comments: place.comments,
      savedByTrustedPeople: place.savedBySelected
    },
    personal: {
      isSaved,
      status: isSaved ? place.status : undefined,
      note: isSaved ? place.personalNote : undefined,
      rating: isSaved ? place.rating : undefined
    },
    providerDetails: googleDetails
      ? {
          status: "ready",
          provider: "google",
          data: googleDetails
        }
      : {
          status: googleDetailsEnabled ? "unreconciled" : "disabled",
          provider: "google",
          message: googleDetailsEnabled
            ? "No reconciled Google place reference is available."
            : "Google place details are disabled."
        }
  };
}
