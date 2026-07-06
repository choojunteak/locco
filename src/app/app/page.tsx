import Link from "next/link";
import { PlaceCard } from "@/components/PlaceCard";
import { DEMO_USER_DISPLAY_NAME } from "@/lib/demoIdentity";
import { getFoodLists } from "@/lib/data/lists";
import { getFavouritePlaces } from "@/lib/data/places";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const [foodLists, favourites] = await Promise.all([getFoodLists(), getFavouritePlaces(3)]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold text-tomato">Mock signed in as {DEMO_USER_DISPLAY_NAME}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Plan your next food stop</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          This MVP runs on local mock data today. Supabase auth and persistence are already planned
          in the project structure.
        </p>
        <Link
          href="/app/map"
          className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
        >
          Go to map
        </Link>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-ink">Trusted lists</h2>
          <Link href="/app/lists" className="text-sm font-bold text-tomato">
            See all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {foodLists.map((list) => (
            <article key={list.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ backgroundColor: list.color }}
              >
                {list.avatar}
              </div>
              <h3 className="font-bold text-ink">{list.name}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{list.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black text-ink">Favourite saves</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {favourites.map((place) => (
            <PlaceCard key={place.id} place={place} lists={foodLists} />
          ))}
        </div>
      </section>
    </main>
  );
}
