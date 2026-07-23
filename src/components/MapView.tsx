"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { PlaceSheetSnapState } from "@/components/PlaceBottomSheet";
import type { LocationSearchResult, MergedPlace } from "@/types";

type Props = {
  places: MergedPlace[];
  highlightedIds: string[];
  selectedPlace: MergedPlace | null;
  placeSheetSnapState: PlaceSheetSnapState;
  referencePoint: LocationSearchResult | null;
  onSelectPlace: (place: MergedPlace) => void;
};

type PlaceFeatureProperties = {
  placeId: string;
  name: string;
  category: string;
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

function toGeoJson(
  places: MergedPlace[],
  highlightedIds: string[],
  selectedPlaceId?: string
): FeatureCollection<Point, PlaceFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [place.longitude, place.latitude]
      },
      properties: {
        placeId: place.id,
        name: place.name,
        category: place.categories[0],
        isHighlighted: highlightedIds.includes(place.id),
        isSelected: selectedPlaceId === place.id
      }
    }))
  };
}

function selectedPlacePadding(snapState: PlaceSheetSnapState) {
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const midPadding = Math.round(Math.min(360, Math.max(250, viewportHeight * 0.4)));
  const expandedPadding = Math.round(Math.min(640, Math.max(430, viewportHeight * 0.72)));

  return {
    top: 112,
    bottom:
      snapState === "minimized"
        ? 168
        : snapState === "expanded"
          ? expandedPadding
          : midPadding,
    left: 48,
    right: 48
  };
}

export function MapView({
  places,
  highlightedIds,
  selectedPlace,
  placeSheetSnapState,
  referencePoint,
  onSelectPlace
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const placesRef = useRef(places);
  const onSelectRef = useRef(onSelectPlace);
  const geoJsonRef = useRef<FeatureCollection<Point, PlaceFeatureProperties>>(
    toGeoJson(places, highlightedIds, selectedPlace?.id)
  );
  const referenceMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hasWarnedTileErrorRef = useRef(false);

  const geoJson = useMemo(
    () => toGeoJson(places, highlightedIds, selectedPlace?.id),
    [places, highlightedIds, selectedPlace]
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
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: singaporeStyle,
      center: [103.84, 1.302],
      zoom: 11.2,
      minZoom: 10
    });

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
            ["get", "category"],
            "Cafe",
            "#10b981",
            "Dessert",
            "#f59e0b",
            "Japanese",
            "#fb7185",
            "Korean",
            "#8b5cf6",
            "Local",
            "#f97316",
            "Cheap Eats",
            "#38bdf8",
            "#231f20"
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
            "#231f20",
            ["boolean", ["get", "isHighlighted"], false],
            "#f36b4f",
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
    if (!mapRef.current || !selectedPlace) return;
    mapRef.current.easeTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 15.4),
      padding: selectedPlacePadding(placeSheetSnapState),
      duration: 650
    });
  }, [selectedPlace, placeSheetSnapState]);

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
