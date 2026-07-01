"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";

export function AppShell({
  children,
  showDataFallbackWarning = false
}: {
  children: React.ReactNode;
  showDataFallbackWarning?: boolean;
}) {
  const pathname = usePathname();
  const isMapPage = pathname === "/app/map";

  return (
    <div className="min-h-dvh bg-cream">
      <header
        className={`sticky top-0 z-50 border-b border-forest/15 bg-blossom/90 px-5 backdrop-blur ${
          isMapPage ? "py-3" : "py-4"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/app/map"
            className={`flex items-center gap-3 ${
              isMapPage ? "text-lg" : "text-xl"
            } font-black text-ink`}
          >
            <Image
              src="/logo.png"
              alt="Locco logo"
              width={40}
              height={40}
              className="rounded-xl"
              priority
            />
            <span>Locco</span>
          </Link>

          <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600 shadow-sm">
            Mock auth
          </div>
        </div>
      </header>

      {showDataFallbackWarning ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-bold text-amber-900">
          Using mock data - Supabase read failed
        </div>
      ) : null}

      {children}
      {isMapPage ? null : <BottomNav />}
    </div>
  );
}
