import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceStack } from "@/components/PlaceStack";
import { getListById } from "@/lib/data/lists";
import { getPlacesByListId } from "@/lib/data/places";

export const dynamic = "force-dynamic";

const palette = {
  cream: "#DDD3C9",
  berry: "#ECC4C3",
  blossom: "#B97D7B",
  forest: "#575527",
  ink: "#231F20",
  softBg: "#FFF8EF",
};

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await getListById(id);
  if (!list) notFound();

  const places = await getPlacesByListId(list.id);

  return (
    <main
      className="min-h-screen overflow-hidden px-4 pb-40 pt-6 sm:px-6 lg:px-10"
      style={{ backgroundColor: palette.softBg }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/app/lists"
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl font-black shadow-sm transition hover:-translate-y-0.5"
            style={{
              backgroundColor: palette.berry,
              color: palette.ink,
            }}
            aria-label="Back to lists"
          >
            ‹
          </Link>

          <div className="text-center">
            <p
              className="text-xs font-black uppercase tracking-[0.2em]"
              style={{ color: palette.blossom }}
            >
              {list.ownerName}'s list
            </p>

            <h1
              className="mt-1 text-2xl font-black leading-tight sm:text-4xl"
              style={{ color: palette.ink }}
            >
              {list.name}
            </h1>
          </div>

          <Link
            href={`/app/map?lists=${list.id}`}
            className="rounded-full px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5"
            style={{
              backgroundColor: palette.forest,
              color: palette.cream,
            }}
          >
            Map
          </Link>
        </header>

        <PlaceStack places={places} listId={list.id} />
      </div>
    </main>
  );
}