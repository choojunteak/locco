"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type LoadedGoogleMapsLibraries = {
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
};

let configuredIdentity: string | null = null;
let loadingPromise: Promise<LoadedGoogleMapsLibraries> | null = null;

export function loadGoogleMapsLibraries({
  apiKey,
  mapId
}: {
  apiKey?: string;
  mapId?: string;
}) {
  if (!apiKey || !mapId) {
    return Promise.reject(new Error("Google Maps public configuration is incomplete."));
  }

  const identity = `${apiKey}:${mapId}`;
  if (configuredIdentity && configuredIdentity !== identity) {
    return Promise.reject(
      new Error("Google Maps was already initialized with different public configuration.")
    );
  }

  if (!loadingPromise) {
    configuredIdentity = identity;
    setOptions({
      key: apiKey,
      v: "weekly",
      mapIds: [mapId],
      authReferrerPolicy: "origin"
    });
    loadingPromise = Promise.all([importLibrary("maps"), importLibrary("marker")]).then(
      ([maps, marker]) => ({ maps, marker })
    );
  }

  return loadingPromise;
}
