export function buildMapUrlSearchParams({
  currentQuery,
  selectedListIds,
  selectedPlaceId
}: {
  currentQuery: string;
  selectedListIds: readonly string[];
  selectedPlaceId?: string;
}) {
  const params = new URLSearchParams(currentQuery);
  params.set("lists", selectedListIds.join(","));

  if (selectedPlaceId) {
    params.set("place", selectedPlaceId);
  } else {
    params.delete("place");
  }

  return params;
}
