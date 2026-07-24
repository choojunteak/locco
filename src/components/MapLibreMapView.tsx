"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { MapRendererCommonProps } from "@/types";
import { getSelectedPlaceCameraInsets } from "@/lib/map/camera";
import { createCanonicalMarkerModels } from "@/lib/map/markerModel";

type PlaceFeatureProperties = {
  placeId: string;
  name: string;
  markerState: "normal" | "want-to-try" | "visited" | "highlighted" | "selected";
  isHighlighted: boolean;
  isSelected: boolean;
};

const singaporeStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
};

function isNonFatalTileError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("tile.openstreetmap.org") || error.message.includes("Failed to fetch");
}

function toGeoJson({
  places,
  highlightedIds,
  savedPlaceIds,
  selectedPlaceId
}: Pick<MapRendererCommonProps, "places" | "highlightedIds" | "savedPlaceIds"> & {
  selectedPlaceId?: string;
}): FeatureCollection<Point, PlaceFeatureProperties> {
  const markerModels = createCanonicalMarkerModels({
    places,
    highlightedIds,
    savedPlaceIds,
    selectedPlaceId
  });

  return {
    type: "FeatureCollection",
    features: markerModels.map((marker) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [marker.longitude, marker.latitude]
      },
      properties: {
        placeId: marker.placeId,
        name: marker.label,
        markerState: marker.state,
        isHighlighted: marker.state === "highlighted",
        isSelected: marker.state === "selected"
      }
    }))
  };
}

export function MapLibreMapView({
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
}: MapRendererCommonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const initialViewportRef = useRef(viewport);
  const placesRef = useRef(places);
  const onSelectRef = useRef(onSelectPlace);
  const onViewportChangeRef = useRef(onViewportChange);
  const onReadyRef = useRef(onReady);
  const onFatalErrorRef = useRef(onFatalError);
  const geoJsonRef = useRef<FeatureCollection<Point, PlaceFeatureProperties>>(
    toGeoJson({
      places,
      highlightedIds,
      savedPlaceIds,
      selectedPlaceId: selectedPlace?.id
    })
  );
  const referenceMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hasWarnedTileErrorRef = useRef(false);

  const geoJson = useMemo(
    () =>
      toGeoJson({
        places,
        highlightedIds,
        savedPlaceIds,
        selectedPlaceId: selectedPlace?.id
      }),
    [places, highlightedIds, savedPlaceIds, selectedPlace]
  );

  useEffect(() => {
    geoJsonRef.current = geoJson;
  }, [geoJson]);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    onSelectRef.current = onSelectPlace;
  }, [onSelectPlace]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
    onReadyRef.current = onReady;
    onFatalErrorRef.current = onFatalError;
  }, [onFatalError, onReady, onViewportChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: singaporeStyle,
        center: [
          initialViewportRef.current.center.longitude,
          initialViewportRef.current.center.latitude
        ],
        zoom: initialViewportRef.current.zoom,
        minZoom: 10
      });
    } catch (error) {
      onFatalErrorRef.current?.({
        renderer: "maplibre",
        code: "initialization",
        message: error instanceof Error ? error.message : "MapLibre failed to initialize."
      });
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");

    map.on("error", (event) => {
      if (isNonFatalTileError(event.error)) {
        if (!hasWarnedTileErrorRef.current) {
          hasWarnedTileErrorRef.current = true;
          console.warn("[Locco] Map tile request failed; keeping the map usable.");
        }
        return;
      }

      console.warn("[Locco] MapLibre reported a non-fatal map error.", event.error);
    });

    map.on("load", () => {
      map.addSource("places", {
        type: "geojson",
        data: geoJsonRef.current,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 48
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#231f20",
          "circle-radius": ["step", ["get", "point_count"], 22, 6, 28, 14, 34],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#fff8ef"
        }
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 13
        },
        paint: {
          "text-color": "#ffffff"
        }
      });

      map.addLayer({
        id: "recommended-glow",
        type: "circle",
        source: "places",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["boolean", ["get", "isHighlighted"], false],
          ["!", ["boolean", ["get", "isSelected"], false]]
        ],
        paint: {
          "circle-color": "#f36b4f",
          "circle-radius": 22,
          "circle-opacity": 0.16,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.9
        }
      });

      map.addLayer({
        id: "selected-glow",
        type: "circle",
        source: "places",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["boolean", ["get", "isSelected"], false]
        ],
        paint: {
          "circle-color": "#f36b4f",
          "circle-radius": 30,
          "circle-opacity": 0.22,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#231f20",
          "circle-stroke-opacity": 0.18
        }
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "markerState"],
            "want-to-try",
            "#FFF1B5",
            "visited",
            "#ECC4C3",
            "highlighted",
            "#B97D7B",
            "selected",
            "#231F20",
            "#575527"
          ],
          "circle-radius": [
            "case",
            ["boolean", ["get", "isSelected"], false],
            14,
            ["boolean", ["get", "isHighlighted"], false],
            12,
            10
          ],
          "circle-stroke-width": [
            "case",
            ["boolean", ["get", "isSelected"], false],
            5,
            ["boolean", ["get", "isHighlighted"], false],
            4,
            3
          ],
          "circle-stroke-color": [
            "case",
            ["boolean", ["get", "isSelected"], false],
            "#FFF1B5",
            ["boolean", ["get", "isHighlighted"], false],
            "#231F20",
            "#ffffff"
          ]
        }
      });

      map.addLayer({
        id: "place-labels",
        type: "symbol",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        minzoom: 13.2,
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["case", ["boolean", ["get", "isSelected"], false], 13, 12],
          "text-offset": ["case", ["boolean", ["get", "isSelected"], false], ["literal", [0, 1.85]], ["literal", [0, 1.55]]],
          "text-anchor": "top"
        },
        paint: {
          "text-color": "#231f20",
          "text-halo-color": "#ffffff",
          "text-halo-width": ["case", ["boolean", ["get", "isSelected"], false], 1.6, 1.2]
        }
      });

      onReadyRef.current?.();
    });

    map.on("click", "clusters", async (event) => {
      const features = map.queryRenderedFeatures(event.point, { layers: ["clusters"] });
      const clusterId = features[0]?.properties?.cluster_id as number | undefined;
      const source = map.getSource("places") as maplibregl.GeoJSONSource | undefined;
      if (clusterId == null || !source) return;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: (features[0].geometry as Point).coordinates as [number, number], zoom });
    });

    map.on("click", "unclustered-point", (event) => {
      const feature = event.features?.[0];
      const placeId = feature?.properties?.placeId as string | undefined;
      const place = placesRef.current.find((item) => item.id === placeId);
      if (place) onSelectRef.current(place);
    });

    map.on("click", "place-labels", (event) => {
      const feature = event.features?.[0];
      const placeId = feature?.properties?.placeId as string | undefined;
      const place = placesRef.current.find((item) => item.id === placeId);
      if (place) onSelectRef.current(place);
    });

    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "unclustered-point", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "unclustered-point", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "place-labels", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "place-labels", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      onViewportChangeRef.current({
        center: {
          latitude: center.lat,
          longitude: center.lng
        },
        zoom: map.getZoom(),
        bounds: {
          north: bounds.getNorth(),
          east: bounds.getEast(),
          south: bounds.getSouth(),
          west: bounds.getWest()
        }
      });
    });

    mapRef.current = map;

    return () => {
      referenceMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource("places") as maplibregl.GeoJSONSource | undefined;
    source?.setData(geoJson);
  }, [geoJson]);

  useEffect(() => {
    if (
      !mapRef.current ||
      !selectedPlace ||
      cameraIntent.kind !== "focus-place" ||
      cameraIntent.placeId !== selectedPlace.id
    ) {
      return;
    }
    mapRef.current.easeTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 15.4),
      padding: getSelectedPlaceCameraInsets(placeSheetSnapState, window.innerHeight),
      duration: 650
    });
  }, [cameraIntent, selectedPlace, placeSheetSnapState]);

  useEffect(() => {
    if (!mapRef.current) return;
    referenceMarkerRef.current?.remove();
    referenceMarkerRef.current = null;
    if (!referencePoint) return;
    referenceMarkerRef.current = new maplibregl.Marker({ color: "#f36b4f" })
      .setLngLat([referencePoint.coordinates.longitude, referencePoint.coordinates.latitude])
      .addTo(mapRef.current);
    mapRef.current.easeTo({
      center: [referencePoint.coordinates.longitude, referencePoint.coordinates.latitude],
      zoom: 13,
      duration: 500
    });
  }, [referencePoint]);

  return <div ref={containerRef} className="h-full min-h-0 w-full" />;
}
