"use client";

import type { LoccoMarkerModel, LoccoMarkerVisualState } from "@/lib/map/markerModel";

const stateGlyph: Record<LoccoMarkerVisualState, string> = {
  normal: "L",
  "want-to-try": "+",
  visited: "✓",
  highlighted: "★",
  selected: "L",
  transient: "G"
};

function markerElement({
  state,
  label,
  glyph,
  extraClass = ""
}: {
  state: LoccoMarkerVisualState | "cluster" | "reference";
  label: string;
  glyph: string;
  extraClass?: string;
}) {
  const element = document.createElement("div");
  element.className = `locco-map-marker locco-map-marker--${state} ${extraClass}`.trim();
  element.dataset.markerState = state;
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", label);

  const face = document.createElement("span");
  face.className = "locco-map-marker__face";
  face.textContent = glyph;
  face.setAttribute("aria-hidden", "true");
  element.append(face);

  return element;
}

export function createLoccoMarkerContent(marker: LoccoMarkerModel) {
  return markerElement({
    state: marker.state,
    label: `${marker.label}, ${marker.state.replaceAll("-", " ")}`,
    glyph: stateGlyph[marker.state]
  });
}

export function createLoccoClusterContent(count: number) {
  return markerElement({
    state: "cluster",
    label: `${count} Locco places`,
    glyph: String(count)
  });
}

export function createLoccoReferencePointContent(label: string) {
  return markerElement({
    state: "reference",
    label: `Search reference: ${label}`,
    glyph: "◎"
  });
}
