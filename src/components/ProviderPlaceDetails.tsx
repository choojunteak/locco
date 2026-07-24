import type { ProviderPlaceDetailsState } from "@/types";

function operationalStatusLabel(
  status: "operational" | "temporarily_closed" | "permanently_closed" | "moved"
) {
  if (status === "temporarily_closed") return "Temporarily closed";
  if (status === "permanently_closed") return "Permanently closed";
  if (status === "moved") return "Moved";
  return "Open for business";
}

export function ProviderPlaceDetails({
  details
}: {
  details: ProviderPlaceDetailsState;
}) {
  if (details.status !== "ready") return null;

  const { data } = details;
  const hasRichDetails = Boolean(
    data.operationalStatus ||
      data.rating ||
      data.openingHours ||
      data.photoReferences?.length
  );
  if (!hasRichDetails) return null;

  return (
    <section className="mt-4 border-t border-stone-100 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
          Place information
        </p>
        <p className="text-[10px] font-bold text-stone-400">{data.attributionLabel}</p>
      </div>
      <div className="mt-2 grid gap-2 text-sm text-stone-700">
        {data.operationalStatus ? (
          <p className="font-semibold">{operationalStatusLabel(data.operationalStatus)}</p>
        ) : null}
        {data.rating ? (
          <p>
            <span className="font-black text-ink">{data.rating.value.toFixed(1)}</span> on Google
            {data.rating.count ? ` (${data.rating.count} ratings)` : ""}
          </p>
        ) : null}
        {data.openingHours?.isOpenNow !== undefined ? (
          <p>{data.openingHours.isOpenNow ? "Open now" : "Closed now"}</p>
        ) : null}
        {data.openingHours?.weekdayDescriptions.map((description) => (
          <p key={description} className="text-xs text-stone-500">
            {description}
          </p>
        ))}
        {data.photoReferences?.length ? (
          <p className="text-xs text-stone-500">
            {data.photoReferences.length} Google photo reference
            {data.photoReferences.length === 1 ? "" : "s"} available
          </p>
        ) : null}
      </div>
    </section>
  );
}
