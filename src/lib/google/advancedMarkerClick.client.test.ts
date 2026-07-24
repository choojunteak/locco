import { describe, expect, it, vi } from "vitest";
import {
  bindAdvancedMarkerClick,
  disposeAdvancedMarkerClickBinding,
  disposeAdvancedMarkerClickBindings
} from "@/lib/google/advancedMarkerClick.client";

type Listener = (event: google.maps.marker.AdvancedMarkerClickEvent) => void;

function createMarkerHarness() {
  const listeners = new Set<Listener>();
  const marker = {
    map: {} as google.maps.Map,
    addEventListener: vi.fn((type: string, listener: Listener) => {
      if (type === "gmp-click") listeners.add(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: Listener) => {
      if (type === "gmp-click") listeners.delete(listener);
    })
  };

  return {
    marker: marker as unknown as google.maps.marker.AdvancedMarkerElement,
    click() {
      listeners.forEach((listener) =>
        listener({} as google.maps.marker.AdvancedMarkerClickEvent)
      );
    }
  };
}

describe("Advanced Marker click lifecycle", () => {
  it("binds the supported gmp-click event and disposes that exact listener", () => {
    const harness = createMarkerHarness();
    const onClick = vi.fn();
    const binding = bindAdvancedMarkerClick(harness.marker, onClick);

    expect(harness.marker.addEventListener).toHaveBeenCalledWith(
      "gmp-click",
      binding.listener
    );

    harness.click();
    expect(onClick).toHaveBeenCalledTimes(1);

    disposeAdvancedMarkerClickBinding(binding);

    expect(harness.marker.removeEventListener).toHaveBeenCalledWith(
      "gmp-click",
      binding.listener
    );
    expect(harness.marker.map).toBeNull();

    harness.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("cleans up every marker binding across renderer lifecycle replacement", () => {
    const first = createMarkerHarness();
    const second = createMarkerHarness();
    const firstClick = vi.fn();
    const secondClick = vi.fn();
    const bindings = [
      bindAdvancedMarkerClick(first.marker, firstClick),
      bindAdvancedMarkerClick(second.marker, secondClick)
    ];

    disposeAdvancedMarkerClickBindings(bindings);
    first.click();
    second.click();

    expect(firstClick).not.toHaveBeenCalled();
    expect(secondClick).not.toHaveBeenCalled();
    expect(first.marker.map).toBeNull();
    expect(second.marker.map).toBeNull();
  });
});
