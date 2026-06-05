"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app", label: "Home" },
  { href: "/app/map", label: "Map" },
  { href: "/app/lists", label: "Lists" },
];

const palette = {
  cream: "#DDD3C9",
  berry: "#ECC4C3",
  forest: "#575527",
  ink: "#231F20",
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4">
      <div
        className="pointer-events-auto mx-auto grid max-w-md grid-cols-3 gap-2 rounded-full p-1.5 backdrop-blur"
        style={{
          backgroundColor: "rgba(236, 196, 195, 0.78)",
          boxShadow: "0 18px 45px rgba(87, 85, 39, 0.18)",
        }}
      >
        {navItems.map((item) => {
          const active =
            item.href === "/app/lists"
              ? pathname?.startsWith("/app/lists")
              : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-3 text-center text-sm font-black transition hover:-translate-y-0.5"
              style={{
                backgroundColor: active ? palette.forest : "transparent",
                color: active ? palette.cream : "rgba(35, 31, 32, 0.58)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}