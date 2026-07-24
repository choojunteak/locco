export type AdvancedMarkerClickBinding = {
  marker: google.maps.marker.AdvancedMarkerElement;
  listener: (event: google.maps.marker.AdvancedMarkerClickEvent) => void;
};

export function bindAdvancedMarkerClick(
  marker: google.maps.marker.AdvancedMarkerElement,
  onClick: () => void
): AdvancedMarkerClickBinding {
  const listener = () => {
    onClick();
  };

  marker.addEventListener("gmp-click", listener);

  return {
    marker,
    listener
  };
}

export function disposeAdvancedMarkerClickBinding({
  marker,
  listener
}: AdvancedMarkerClickBinding) {
  marker.removeEventListener("gmp-click", listener);
  marker.map = null;
}

export function disposeAdvancedMarkerClickBindings(
  bindings: AdvancedMarkerClickBinding[]
) {
  bindings.forEach(disposeAdvancedMarkerClickBinding);
}
