import Image from "next/image";
import Link from "next/link";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-5 text-center">
        <Link
          href="/app/map"
          className="mb-8 flex items-center justify-center rounded-[2rem] bg-berry/45 p-5  transition hover:-translate-y-1 hover:bg-berry/65"
        >
          <Image
            src="/logo.png"
            alt="Locco logo"
            width={120}
            height={120}
            priority
            className="rounded-3xl"
          />
        </Link>

        <h1
          className={`${fraunces.className} max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.04em] text-forest sm:text-6xl lg:text-7xl`}
        >
          But where should we go....
        </h1>

        <p className="mt-6 max-w-xl text-base font-semibold leading-7 text-forest/70 sm:text-lg">
          Locco helps you remember where to eat, explore, and go next.
        </p>
      </section>
    </main>
  );
}