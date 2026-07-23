"use client";

import Link from "next/link";

type Props = {
  onAskLocco: () => void;
  onAddPlace: () => void;
};

const navigationItems = [
  { href: "/app", label: "Home" },
  { href: "/app/map", label: "Map", active: true },
  { href: "/app/lists", label: "Lists" }
];

export function MapBottomControls({ onAskLocco, onAddPlace }: Props) {
  return (
    <div className="map-bottom-controls pointer-events-none fixed inset-x-0 z-30 flex flex-col items-center">
      <div className="map-bottom-actions pointer-events-auto flex w-max items-center gap-2">
        <button
          type="button"
          onClick={onAskLocco}
          className="flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-tomato px-5 text-sm font-black text-white shadow-soft"
        >
          Ask Locco
        </button>
        <button
          type="button"
          onClick={onAddPlace}
          className="flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-ink px-5 text-sm font-black text-white shadow-soft"
        >
          Add
        </button>
      </div>

      <nav
        className="pointer-events-auto h-[var(--map-nav-height)] rounded-full bg-white/95 p-1.5 shadow-soft ring-1 ring-stone-200 backdrop-blur"
        aria-label="Map navigation"
      >
        <div className="grid h-full grid-cols-3 gap-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-full items-center justify-center rounded-full px-4 text-center text-xs font-black transition ${
                item.active ? "bg-ink text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
