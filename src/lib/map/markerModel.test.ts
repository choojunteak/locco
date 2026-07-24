import { describe, expect, it } from "vitest";
import {
  canonicalMarkerKey,
  resolveLoccoMarkerState,
  transientGoogleMarkerKey
} from "@/lib/map/markerModel";

describe("Locco marker model", () => {
  it("applies selected, highlighted, and personal-save priority in that order", () => {
    expect(
      resolveLoccoMarkerState({
        isSelected: true,
        isHighlighted: true,
        isSaved: true,
        status: "visited"
      })
    ).toBe("selected");
    expect(
      resolveLoccoMarkerState({
        isSelected: false,
        isHighlighted: true,
        isSaved: true,
        status: "visited"
      })
    ).toBe("highlighted");
    expect(
      resolveLoccoMarkerState({
        isSelected: false,
        isHighlighted: false,
        isSaved: true,
        status: "visited"
      })
    ).toBe("visited");
    expect(
      resolveLoccoMarkerState({
        isSelected: false,
        isHighlighted: false,
        isSaved: true,
        status: "want_to_try"
      })
    ).toBe("want-to-try");
    expect(
      resolveLoccoMarkerState({
        isSelected: false,
        isHighlighted: false,
        isSaved: false,
        status: "visited"
      })
    ).toBe("normal");
  });

  it("keeps canonical Locco and transient Google identity namespaces separate", () => {
    expect(canonicalMarkerKey("10d287e4")).toBe("locco:10d287e4");
    expect(transientGoogleMarkerKey("ChIJ123")).toBe("google:ChIJ123");
  });
});
