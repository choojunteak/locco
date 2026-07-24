import type { MapCameraInsets, MapSheetSnapState } from "@/types/mapRenderer";

export function getSelectedPlaceCameraInsets(
  snapState: MapSheetSnapState,
  viewportHeight = 800
): MapCameraInsets {
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
