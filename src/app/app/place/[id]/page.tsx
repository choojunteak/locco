import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceCard } from "@/components/PlaceCard";
import { loccoMapLink } from "@/utils/places";
import { getFoodLists } from "@/lib/data/lists";
import { getPlaceById } from "@/lib/data/places";

export const dynamic = "force-dynamic";

function getSafeListBackHref(from?: string) {
  if (!from?.startsWith("/app/lists/")) return null;
  if (from.startsWith("//") || from.includes("://") || from.includes("\\") || from.includes("?")) {
    return null;
  }

  return from;
}

export default async function PlacePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const [place, lists] = await Promise.all([getPlaceById(id), getFoodLists()]);
  if (!place) notFound();

  const mergedPlace = { ...place, selectedListIds: place.listIds, savedBySelected: place.savedBy };
  const listBackHref = getSafeListBackHref(from);
  const backHref = listBackHref ?? "/app/map";
  const backLabel = listBackHref ? "Back to list" : "Back to map";

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm font-bold text-tomato">
          {backLabel}
        </Link>
        <Link
          href={loccoMapLink(mergedPlace, mergedPlace.selectedListIds)}
          className="rounded-full bg-[#FFF1B5] px-4 py-2 text-sm font-black text-ink ring-1 ring-[#ECC4C3]"
        >
          View on Locco map
        </Link>
      </div>
      <div className="mt-4">
        <PlaceCard place={mergedPlace} lists={lists} isLarge />
      </div>
    </main>
  );
}
