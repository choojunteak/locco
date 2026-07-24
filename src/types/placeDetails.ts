import type { ExternalProviderReference } from "@/types/locationSearch";
import type { PlaceStatus } from "@/types";

export type GooglePlaceOperationalStatus =
  | "operational"
  | "temporarily_closed"
  | "permanently_closed"
  | "moved";

export type GoogleProviderPlaceDetails = {
  source: "google";
  externalReference: ExternalProviderReference & { provider: "google" };
  displayName?: string;
  formattedAddress?: string;
  operationalStatus?: GooglePlaceOperationalStatus;
  rating?: {
    value: number;
    count?: number;
  };
  openingHours?: {
    isOpenNow?: boolean;
    closesAt?: string;
    nextOpensAt?: string;
    weekdayDescriptions: string[];
  };
  photoReferences?: Array<{
    name: string;
    attribution?: string;
  }>;
  attributionLabel: "Google Maps";
};

export type ProviderPlaceDetailsState =
  | {
      status: "disabled" | "unreconciled" | "loading" | "error";
      provider: "google";
      message?: string;
    }
  | {
      status: "ready";
      provider: "google";
      data: GoogleProviderPlaceDetails;
    };

export type PlaceDetailViewModel = {
  canonicalPlaceId: string;
  identity: {
    name: string;
    address: string;
    categories: string[];
  };
  media: {
    loccoPhotos: Array<{
      url: string;
      alt: string;
    }>;
    providerPhotoReferences: Array<{
      name: string;
      attribution?: string;
    }>;
    fallback: "placeholder";
  };
  locco: {
    notes: string;
    tags: string[];
    comments: Array<{ author: string; text: string }>;
    savedByTrustedPeople: string[];
    communityRating?: {
      value: number;
      count: number;
    };
  };
  personal: {
    isSaved: boolean;
    status?: PlaceStatus;
    note?: string;
    rating?: number;
  };
  providerDetails: ProviderPlaceDetailsState;
};
