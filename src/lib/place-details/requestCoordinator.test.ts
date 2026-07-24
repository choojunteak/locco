import { describe, expect, it, vi } from "vitest";
import { SelectedPlaceDetailRequestCoordinator } from "@/lib/place-details/requestCoordinator";

describe("selected-place detail request coordinator", () => {
  it("does not start background work for an unselected place", () => {
    const coordinator = new SelectedPlaceDetailRequestCoordinator<string>();
    const load = vi.fn(async () => "details");

    expect(
      coordinator.request({
        selectedPlaceId: "place-a",
        requestKey: "place-a:identity",
        load
      })
    ).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it("deduplicates matching in-flight requests", async () => {
    const coordinator = new SelectedPlaceDetailRequestCoordinator<string>();
    coordinator.select("place-a");
    const load = vi.fn(async () => "details");

    const first = coordinator.request({
      selectedPlaceId: "place-a",
      requestKey: "place-a:identity",
      load
    });
    const second = coordinator.request({
      selectedPlaceId: "place-a",
      requestKey: "place-a:identity",
      load
    });

    await expect(first).resolves.toBe("details");
    await expect(second).resolves.toBe("details");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("discards a response after selection generation changes", async () => {
    const coordinator = new SelectedPlaceDetailRequestCoordinator<string>();
    coordinator.select("place-a");
    let resolveRequest: (value: string) => void = () => undefined;
    const pending = coordinator.request({
      selectedPlaceId: "place-a",
      requestKey: "place-a:identity",
      load: () =>
        new Promise<string>((resolve) => {
          resolveRequest = resolve;
        })
    });

    coordinator.select("place-b");
    resolveRequest("stale");

    await expect(pending).resolves.toBeNull();
  });
});
