export type SelectedDetailRequest<T> = {
  selectedPlaceId: string;
  requestKey: string;
  load: () => Promise<T>;
};

export class SelectedPlaceDetailRequestCoordinator<T> {
  private selectedPlaceId: string | null = null;
  private selectionGeneration = 0;
  private inFlight = new Map<string, Promise<T>>();

  select(placeId: string | null) {
    if (placeId === this.selectedPlaceId) return;
    this.selectedPlaceId = placeId;
    this.selectionGeneration += 1;
  }

  request({ selectedPlaceId, requestKey, load }: SelectedDetailRequest<T>) {
    if (!this.selectedPlaceId || selectedPlaceId !== this.selectedPlaceId) {
      return null;
    }

    const generation = this.selectionGeneration;
    const existing = this.inFlight.get(requestKey);
    if (existing) {
      return existing.then((value) =>
        generation === this.selectionGeneration && selectedPlaceId === this.selectedPlaceId
          ? value
          : null
      );
    }

    const request = load().finally(() => {
      if (this.inFlight.get(requestKey) === request) {
        this.inFlight.delete(requestKey);
      }
    });
    this.inFlight.set(requestKey, request);

    return request.then((value) =>
      generation === this.selectionGeneration && selectedPlaceId === this.selectedPlaceId
        ? value
        : null
    );
  }
}
