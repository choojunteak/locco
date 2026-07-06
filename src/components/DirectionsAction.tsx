"use client";

import { useState } from "react";
import type { FoodPlace } from "@/types";
import { appleMapsLink, googleMapsLink } from "@/utils/places";

type Props = {
  place: Pick<FoodPlace, "name" | "address" | "latitude" | "longitude">;
  className?: string;
};

export function DirectionsAction({ place, className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyAddress() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(place.address);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = place.address;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  function openSheet() {
    setCopyStatus("idle");
    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={
          className ??
          "rounded-full bg-ink px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5"
        }
      >
        Directions
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/30 px-4 pb-4 backdrop-blur-[2px] sm:items-center sm:pb-0"
          onClick={() => setIsOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Directions for ${place.name}`}
            className="w-full max-w-sm rounded-[2rem] bg-white/95 p-5 shadow-soft ring-1 ring-white/70"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-3 pb-3">
              <h2 className="text-2xl font-black leading-tight text-ink">{place.name}</h2>
              <p className="mt-2 text-sm leading-5 text-stone-500">{place.address}</p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={copyAddress}
                className="rounded-full bg-stone-100 px-5 py-4 text-center text-base font-black text-ink transition hover:bg-stone-200"
              >
                {copyStatus === "copied"
                  ? "Address copied"
                  : copyStatus === "failed"
                    ? "Copy failed"
                    : "Copy address"}
              </button>
              <a
                href={appleMapsLink(place)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-stone-100 px-5 py-4 text-center text-base font-black text-ink transition hover:bg-stone-200"
              >
                Open in Apple Maps
              </a>
              <a
                href={googleMapsLink(place)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-stone-100 px-5 py-4 text-center text-base font-black text-ink transition hover:bg-stone-200"
              >
                Open in Google Maps
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-[#ECC4C3] px-5 py-4 text-center text-base font-black text-ink transition hover:-translate-y-0.5"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
