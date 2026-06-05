import Link from "next/link";
import { getFoodListsWithCounts } from "@/lib/data/lists";

export const dynamic = "force-dynamic";

const palette = {
  cream: "#DDD3C9",
  berry: "#ECC4C3",
  blossom: "#B97D7B",
  meadow: "#928E5E",
  forest: "#575527",
  ink: "#231F20",
};

const cardColours = [
  palette.berry,
  palette.blossom,
  palette.meadow,
  palette.forest,
];

const pillColours = [
  palette.berry,
  palette.blossom,
  palette.meadow,
  palette.cream,
];

export default async function ListsPage() {
  const foodLists = await getFoodListsWithCounts();

  const owners = Array.from(new Set(foodLists.map((list) => list.ownerName)));

  return (
    <main
      className="min-h-screen px-4 pb-28 pt-8 sm:px-6 lg:px-10"
      style={{ backgroundColor: "#FFF8EF" }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            aria-label="Filter lists"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black shadow-sm transition hover:-translate-y-0.5"
            style={{
              backgroundColor: palette.berry,
              color: palette.ink,
              boxShadow: "0 10px 30px rgba(87, 85, 39, 0.12)",
            }}
          >
            ☰
          </button>

          <Link
            href="/app/map"
            className="rounded-full px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5"
            style={{
              backgroundColor: palette.forest,
              color: palette.cream,
            }}
          >
            Map
          </Link>
        </div>

        <div className="mb-6 max-w-3xl">
          <p
            className="text-sm font-black"
            style={{ color: palette.blossom }}
          >
            Saved places
          </p>

          <h1
            className="mt-2 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl"
            style={{ color: palette.ink }}
          >
            Discover more places
          </h1>

          <p
            className="mt-4 max-w-2xl text-sm leading-6 sm:text-base"
            style={{ color: "rgba(35, 31, 32, 0.72)" }}
          >
            Browse your friends’ saved spots and tap a stack to open their list.
          </p>
        </div>

        <div className="mb-8 w-full overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full gap-3">
            <button
              type="button"
              className="shrink-0 rounded-full px-6 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5"
              style={{
                backgroundColor: palette.forest,
                color: palette.cream,
              }}
            >
              All
            </button>

            {owners.map((owner, index) => {
              const bg = pillColours[index % pillColours.length];
              const isDark =
                bg === palette.blossom ||
                bg === palette.meadow ||
                bg === palette.forest;

              return (
                <button
                  key={owner}
                  type="button"
                  className="shrink-0 rounded-full px-6 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5"
                  style={{
                    backgroundColor: bg,
                    color: isDark ? palette.cream : palette.ink,
                  }}
                >
                  {owner}
                </button>
              );
            })}
          </div>
        </div>

        <section
          className="relative overflow-hidden rounded-[2.5rem] px-4 py-6 shadow-sm sm:px-6 sm:py-8 lg:px-8"
          style={{
            backgroundColor: "rgba(236, 196, 195, 0.35)",
            boxShadow: "0 24px 80px rgba(87, 85, 39, 0.12)",
          }}
        >
          <div className="flex snap-x gap-6 overflow-x-auto pb-8 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {foodLists.map((list, index) => {
              const cardColor = cardColours[index % cardColours.length];
              const backCardColor = cardColours[(index + 1) % cardColours.length];

              const isLightCard = cardColor === palette.berry;
              const mainTextColor = isLightCard ? palette.ink : palette.cream;
              const mutedTextColor = isLightCard
                ? "rgba(35, 31, 32, 0.68)"
                : "rgba(221, 211, 201, 0.82)";

              return (
                <Link
                  key={list.id}
                  href={`/app/lists/${list.id}`}
                  className="group relative block min-w-[86%] snap-center focus:outline-none sm:min-w-[68%] md:min-w-[52%] lg:min-w-[42%] xl:min-w-[34%]"
                >
                  <div
                    className="absolute left-7 top-5 h-full w-full rotate-3 rounded-[2.25rem] opacity-35"
                    style={{ backgroundColor: backCardColor }}
                  />

                  <div
                    className="absolute left-3 top-2 h-full w-full -rotate-2 rounded-[2.25rem] opacity-25"
                    style={{ backgroundColor: list.color || palette.meadow }}
                  />

                  <article
                    className="relative h-[30rem] overflow-hidden rounded-[2.25rem] p-7 shadow-sm transition duration-300 group-hover:-translate-y-2 sm:h-[34rem] lg:h-[38rem]"
                    style={{
                      backgroundColor: cardColor,
                      boxShadow: "0 18px 45px rgba(35, 31, 32, 0.13)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30" />

                    <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/20" />
                    <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/10" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black shadow-sm backdrop-blur"
                        style={{
                          backgroundColor: "rgba(221, 211, 201, 0.55)",
                          color: palette.ink,
                        }}
                      >
                        {list.avatar}
                      </div>

                      <div
                        className="rounded-full px-4 py-2 text-xs font-black shadow-sm backdrop-blur"
                        style={{
                          backgroundColor: "rgba(221, 211, 201, 0.55)",
                          color: palette.ink,
                        }}
                      >
                        {list.placeCount} spots
                      </div>
                    </div>

                    <div className="relative flex h-full flex-col justify-end pb-8">
                      <p
                        className="mb-3 text-xs font-black uppercase tracking-[0.24em]"
                        style={{ color: mutedTextColor }}
                      >
                        {list.ownerName}'s list
                      </p>

                      <h2
                        className="text-5xl font-black leading-none sm:text-6xl lg:text-7xl"
                        style={{ color: mainTextColor }}
                      >
                        {list.name}
                      </h2>

                      <p
                        className="mt-5 line-clamp-3 max-w-md text-sm leading-6 sm:text-base"
                        style={{ color: mutedTextColor }}
                      >
                        {list.description}
                      </p>
                    </div>

                    <div
                      className="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-xl shadow-sm"
                      style={{
                        backgroundColor: palette.cream,
                        color: palette.ink,
                      }}
                    >
                      ♥
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Skip"
              className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black shadow-sm transition hover:-translate-y-0.5"
              style={{
                backgroundColor: palette.cream,
                color: palette.ink,
              }}
            >
              ×
            </button>

            <button
              type="button"
              aria-label="Like"
              className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-black shadow-sm transition hover:-translate-y-0.5"
              style={{
                backgroundColor: palette.forest,
                color: palette.cream,
              }}
            >
              ♥
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}