export type FoodCategory =
  | "Saved Spot"
  | "Cafe"
  | "Dessert"
  | "Japanese"
  | "Korean"
  | "Local"
  | "Thai"
  | "Brunch"
  | "Supper"
  | "Bakery"
  | "Drinks"
  | "Ice Cream"
  | "Cheap Eats"
  | "Date Spot";

export type MoodTag =
  | "Date Spot"
  | "Cheap Eats"
  | "Aesthetic"
  | "Good for Groups"
  | "Solo Meal"
  | "Study Cafe"
  | "Late Night"
  | "Near MRT"
  | "Hidden Gem"
  | "Overhyped"
  | "Worth Queueing"
  | "Takeaway Friendly"
  | "Chill"
  | "Comfort Food";

export type PlaceStatus = "want_to_try" | "visited";

export type FoodList = {
  id: string;
  name: string;
  ownerName: string;
  avatar: string;
  description: string;
  color: string;
  isMine?: boolean;
};

export type PlaceSource = {
  type: "tiktok" | "instagram" | "google_maps" | "website" | "manual" | "other";
  url: string;
};

export type PlaceComment = {
  author: string;
  text: string;
};

export type FoodPlace = {
  id: string;
  name: string;
  address: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  categories: FoodCategory[];
  moodTags: MoodTag[];
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  sources: PlaceSource[];
  notes: string;
  personalNote?: string;
  comments: PlaceComment[];
  savedBy: string[];
  listIds: string[];
  status: PlaceStatus;
  rating?: number;
};

export type MergedPlace = FoodPlace & {
  selectedListIds: string[];
  savedBySelected: string[];
};

export type RecommendationResult = MergedPlace & {
  distanceMeters: number;
  score: number;
  matchedTags: string[];
};

export type {
  ExternalLocationSearchProviderId,
  ExternalProviderReference,
  LocationSearchAdapter,
  LocationSearchProviderId,
  LocationSearchProviderMetadata,
  LocationSearchResult,
  LocationSearchResultKind,
  MapRendererMode,
  ValidatedCoordinates
} from "./locationSearch";
