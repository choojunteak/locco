"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MarkerClusterer, type Renderer } from "@googlemaps/markerclusterer";
import type { MapRendererCommonProps } from "@/types";
import { getSelectedPlaceCameraInsets } from "@/lib/map/camera";
import {
  createLoccoClusterContent,
  createLoccoMarkerContent,
  createLoccoReferencePointContent
} from "@/lib/map/loccoMarkerContent.client";
import { createCanonicalMarkerModels } from "@/lib/map/markerModel";
import { loadGoogleMapsLibraries } from "@/lib/google/mapsLoader.client";

type Props = MapRendererCommonProps & {
  apiKey?: string;
  mapId?: string;
};

export function GoogleMapView({
  apiKey,
  mapId,
  places,
  highlightedIds,
  savedPlaceIds,
  selectedPlace,
  placeSheetSnapState,
  referencePoint,
  viewport,
  cameraIntent,
  onViewportChange,
  onSelectPlace,
  onReady,
  onFatalError
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const initialViewportRef = useRef(viewport);
  const markerLibraryRef = useRef<google.maps.MarkerLibrary | null>(null);
  const canonicalMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const referenceMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const onViewportChangeRef = useRef(onViewportChange);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onReadyRef = useRef(onReady);
  const onFatalErrorRef = useRef(onFatalError);
  const [readyGeneration, setReadyGeneration] = useState(0);

  const markerModels = useMemo(
    () =>
      createCanonicalMarkerModels({
        places,
        highlightedIds,
        savedPlaceIds,
        selectedPlaceId: selectedPlace?.id
      }),
    [highlightedIds, places, savedPlaceIds, selectedPlace]
  );

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
    onSelectPlaceRef.current = onSelectPlace;
    onReadyRef.current = onReady;
    onFatalErrorRef.current = onFatalError;
  }, [onFatalError, onReady, onSelectPlace, onViewportChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let isCurrent = true;
    let resizeObserver: ResizeObserver | null = null;

    loadGoogleMapsLibraries({ apiKey, mapId })
      .then(({ maps, marker }) => {
        if (!isCurrent || !containerRef.current) return;

        const map = new maps.Map(containerRef.current, {
          center: {
            lat: initialViewportRef.current.center.latitude,
            lng: initialViewportRef.current.center.longitude
          },
          zoom: initialViewportRef.current.zoom,
          minZoom: 10,
          mapId,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false
        });

        mapRef.current = map;
        markerLibraryRef.current = marker;
        mapListenersRef.current.push(
          map.addListener("idle", () => {
            const center = map.getCenter();
            const bounds = map.getBounds();
            if (!center) return;
            onViewportChangeRef.current({
              center: {
                latitude: center.lat(),
                longitude: center.lng()
              },
              zoom: map.getZoom() ?? initialViewportRef.current.zoom,
              bounds: bounds
                ? {
                    north: bounds.getNorthEast().lat(),
                    east: bounds.getNorthEast().lng(),
                    south: bounds.getSouthWest().lat(),
                    west: bounds.getSouthWest().lng()
                  }
                : undefined
            });
          })
        );

        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            google.maps.event.trigger(map, "resize");
          });
          resizeObserver.observe(container);
        }

        setReadyGeneration((current) => current + 1);
        onReadyRef.current?.();
      })
      .catch((error) => {
        if (!isCurrent) return;
        onFatalErrorRef.current?.({
          renderer: "google",
          code: apiKey && mapId ? "script" : "configuration",
          message: error instanceof Error ? error.message : "Google Maps failed to initialize."
        });
      });

    return () => {
      isCurrent = false;
      resizeObserver?.disconnect();
      mapListenersRef.current.forEach((listener) => listener.remove());
      mapListenersRef.current = [];
      clustererRef.current?.clearMarkers();
      clustererRef.current?.setMap(null);
      clustererRef.current = null;
      canonicalMarkersRef.current.forEach((advancedMarker) => {
        advancedMarker.map = null;
      });
      canonicalMarkersRef.current = [];
      if (referenceMarkerRef.current) {
        referenceMarkerRef.current.map = null;
        referenceMarkerRef.current = null;
      }
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current);
      }
      mapRef.current = null;
      markerLibraryRef.current = null;
      container.replaceChildren();
    };
  }, [apiKey, mapId]);

  useEffect(() => {
    const map = mapRef.current;
    const markerLibrary = markerLibraryRef.current;
    if (!map || !markerLibrary || !readyGeneration) return;

    clustererRef.current?.clearMarkers();
    clustererRef.current?.setMap(null);
    canonicalMarkersRef.current.forEach((advancedMarker) => {
      google.maps.event.clearInstanceListeners(advancedMarker);
      advancedMarker.map = null;
    });

    const placeById = new Map(places.map((place) => [place.id, place]));
    const advancedMarkers = markerModels.map((markerModel) => {
      const advancedMarker = new markerLibrary.AdvancedMarkerElement({
        position: {
          lat: markerModel.latitude,
          lng: markerModel.longitude
        },
        content: createLoccoMarkerContent(markerModel),
        title: markerModel.label,
        gmpClickable: true,
        zIndex:
          markerModel.state === "selected"
            ? 50
            : markerModel.state === "highlighted"
              ? 40
              : 10
      });

      advancedMarker.addListener("click", () => {
        const place = placeById.get(markerModel.placeId);
        if (place) onSelectPlaceRef.current(place);
      });

      return advancedMarker;
    });

    const clusterRenderer: Renderer = {
      render: ({ count, position }) =>
        new markerLibrary.AdvancedMarkerElement({
          position,
          content: createLoccoClusterContent(count),
          title: `${count} Locco places`,
          zIndex: 1000 + count
        })
    };

    canonicalMarkersRef.current = advancedMarkers;
    clustererRef.current = new MarkerClusterer({
      map,
      markers: advancedMarkers,
      renderer: clusterRenderer
    });

    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current?.setMap(null);
      clustererRef.current = null;
      advancedMarkers.forEach((advancedMarker) => {
        google.maps.event.clearInstanceListeners(advancedMarker);
        advancedMarker.map = null;
      });
    };
  }, [markerModels, places, readyGeneration]);

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !selectedPlace ||
      cameraIntent.kind !== "focus-place" ||
      cameraIntent.placeId !== selectedPlace.id
    ) {
      return;
    }

    map.panTo({
      lat: selectedPlace.latitude,
      lng: selectedPlace.longitude
    });
    if ((map.getZoom() ?? 0) < 15.4) {
      map.setZoom(15.4);
    }

    const insets = getSelectedPlaceCameraInsets(placeSheetSnapState, window.innerHeight);
    window.requestAnimationFrame(() => {
      if (mapRef.current !== map) return;
      map.panBy(0, Math.round((insets.bottom - insets.top) / 2));
    });
  }, [cameraIntent, placeSheetSnapState, selectedPlace]);

  useEffect(() => {
    const map = mapRef.current;
    const markerLibrary = markerLibraryRef.current;
    if (!map || !markerLibrary || !readyGeneration) return;

    if (referenceMarkerRef.current) {
      referenceMarkerRef.current.map = null;
      referenceMarkerRef.current = null;
    }
    if (!referencePoint) return;

    referenceMarkerRef.current = new markerLibrary.AdvancedMarkerElement({
      map,
      position: {
        lat: referencePoint.coordinates.latitude,
        lng: referencePoint.coordinates.longitude
      },
      content: createLoccoReferencePointContent(referencePoint.displayName),
      title: `Search reference: ${referencePoint.displayName}`,
      zIndex: 60
    });
    map.panTo({
      lat: referencePoint.coordinates.latitude,
      lng: referencePoint.coordinates.longitude
    });
    map.setZoom(13);
  }, [readyGeneration, referencePoint]);

  return <div ref={containerRef} className="h-full min-h-0 w-full" />;
}
