"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent, type WheelEvent } from "react";

const palette = {
  butter: "#FFF1B5",
  berry: "#ECC4C3",
  blossom: "#B97D7B",
  meadow: "#928E5E",
  forest: "#575527",
  ink: "#231F20",
};

const stackColours = [
  palette.berry,
  palette.blossom,
  palette.meadow,
  palette.forest,
  palette.butter,
];

type PlaceStackPlace = {
  id: string;
  name?: string;
  description?: string;
  address?: string;
  category?: string;
  type?: string;
};

type PlaceStackProps = {
  places: PlaceStackPlace[];
  listId: string;
};

function getPlaceName(place: PlaceStackPlace, index: number) {
  return place.name || `Place ${index + 1}`;
}

function getPlaceCategory(place: PlaceStackPlace) {
  return place.category || place.type || "Saved spot";
}

function getPlaceDescription(place: PlaceStackPlace) {
  return place.description || place.address || "Tap to view more details about this saved place.";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function PlaceStack({ places, listId }: PlaceStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pointerStartRef = useRef({ x: 0, y: 0 });
  const pointerCardIndexRef = useRef<number | null>(null);
  const wheelLockedRef = useRef(false);

  if (places.length === 0) {
    return (
      <div
        className="mx-auto w-full max-w-md rounded-[2rem] p-8 text-center shadow-sm"
        style={{
          backgroundColor: palette.berry,
          color: palette.ink,
        }}
      >
        <h2 className="text-3xl font-black">No places yet</h2>
        <p className="mt-3 text-sm leading-6 opacity-70">
          Saved spots will appear here once this list has places.
        </p>
      </div>
    );
  }

  const activePlace = places[activeIndex];
  const activeColour = stackColours[activeIndex % stackColours.length];
  const activeIsDark = activeColour === palette.forest || activeColour === palette.meadow;
  const activeTextColour = activeIsDark ? palette.butter : palette.ink;
  const activeMutedTextColour = activeIsDark
    ? "rgba(255, 241, 181, 0.78)"
    : "rgba(35, 31, 32, 0.62)";

  function selectPlace(index: number) {
    const nextIndex = clamp(index, 0, places.length - 1);
    setActiveIndex(nextIndex);
    setFlipped(false);
    setDragY(0);
  }

  function goNext() {
    selectPlace(activeIndex + 1);
  }

  function goPrevious() {
    selectPlace(activeIndex - 1);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) < 18 || wheelLockedRef.current) return;

    wheelLockedRef.current = true;

    if (event.deltaY > 0) {
      goNext();
    } else {
      goPrevious();
    }

    window.setTimeout(() => {
      wheelLockedRef.current = false;
    }, 260);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>, index: number) {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    pointerCardIndexRef.current = index;
    setIsDragging(index === activeIndex);
    setDragY(0);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>, index: number) {
    if (!isDragging || index !== activeIndex) return;

    const nextDragY = event.clientY - pointerStartRef.current.y;
    setDragY(clamp(nextDragY, -120, 120));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>, index: number) {
    if (pointerCardIndexRef.current === null) return;

    event.currentTarget.releasePointerCapture(event.pointerId);

    const deltaX = event.clientX - pointerStartRef.current.x;
    const deltaY = event.clientY - pointerStartRef.current.y;
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    setIsDragging(false);
    setDragY(0);

    const isTap = totalMovement < 12;
    const isSwipe = Math.abs(deltaY) > 70;

    if (isSwipe && index === activeIndex) {
      if (deltaY < 0) {
        goNext();
      } else {
        goPrevious();
      }

      pointerCardIndexRef.current = null;
      return;
    }

    if (isTap) {
      if (index === activeIndex) {
        setFlipped((current) => !current);
      } else {
        selectPlace(index);
      }
    }

    pointerCardIndexRef.current = null;
  }

  return (
    <section className="grid min-h-[calc(100vh-14rem)] gap-8 lg:grid-cols-[1.05fr_0.8fr] lg:items-center">
      <div
        className="relative mx-auto h-[calc(100vh-12rem)] min-h-[40rem] w-full max-w-3xl overflow-hidden rounded-[3rem] px-4 pb-10 pt-6 sm:px-8 lg:h-[50rem]"
        style={{
          backgroundColor: "rgba(236, 196, 195, 0.22)",
          boxShadow: "0 24px 80px rgba(87, 85, 39, 0.10)",
          touchAction: "none",
        }}
        onWheel={handleWheel}
      >
        <div className="absolute left-6 top-5 z-30 rounded-full bg-white/55 px-4 py-2 text-xs font-black text-ink shadow-sm backdrop-blur">
          {activeIndex + 1} / {places.length}
        </div>

        <p
          className="absolute right-6 top-6 z-30 hidden text-xs font-black uppercase tracking-[0.18em] sm:block"
          style={{ color: "rgba(35, 31, 32, 0.42)" }}
        >
          Swipe / scroll
        </p>

        {places.map((place, index) => {
          const colour = stackColours[index % stackColours.length];
          const isDark = colour === palette.forest || colour === palette.meadow;
          const isActive = index === activeIndex;
          const relativeIndex = index - activeIndex;

          let top = 0;
          let scale = 1;
          let opacity = 1;
          let zIndex = 20;
          let cardHeight = "18rem";

          if (relativeIndex < 0) {
            const distance = Math.abs(relativeIndex);
            top = 4 + Math.max(0, 4 - distance) * 2.15;
            scale = 1 - Math.min(distance, 5) * 0.025;
            opacity = distance > 5 ? 0 : 1;
            zIndex = 30 - distance;
            cardHeight = "14rem";
          } else if (relativeIndex === 0) {
            top = 16 + dragY / 16;
            scale = isDragging ? 0.985 : 1;
            opacity = 1;
            zIndex = 80;
            cardHeight = "24rem";
          } else {
            const distance = relativeIndex;
            top = 36 + distance * 2.1;
            scale = 1 - Math.min(distance, 5) * 0.018;
            opacity = distance > 5 ? 0 : 1;
            zIndex = 70 - distance;
            cardHeight = "14rem";
          }

          return (
            <div
              key={place.id}
              role="button"
              tabIndex={0}
              onPointerDown={(event) => handlePointerDown(event, index)}
              onPointerMove={(event) => handlePointerMove(event, index)}
              onPointerUp={(event) => handlePointerUp(event, index)}
              onPointerCancel={() => {
                setIsDragging(false);
                setDragY(0);
                pointerCardIndexRef.current = null;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();

                  if (isActive) {
                    setFlipped((current) => !current);
                  } else {
                    selectPlace(index);
                  }
                }

                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  goNext();
                }

                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  goPrevious();
                }
              }}
              className="absolute left-1/2 w-[86%] cursor-pointer text-left outline-none transition-all duration-500 ease-out sm:w-[76%]"
              style={{
                top: `${top}rem`,
                zIndex,
                opacity,
                transform: `translateX(-50%) scale(${scale})`,
                perspective: "1200px",
              }}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  height: cardHeight,
                  transformStyle: "preserve-3d",
                  transform: isActive && flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div
                  className="absolute inset-0 overflow-hidden rounded-[2rem] p-6 shadow-sm"
                  style={{
                    backgroundColor: colour,
                    backfaceVisibility: "hidden",
                    boxShadow: isActive
                      ? "0 24px 55px rgba(35, 31, 32, 0.20)"
                      : "0 12px 30px rgba(35, 31, 32, 0.12)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25" />

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <p
                        className="text-xs font-black uppercase tracking-[0.22em]"
                        style={{
                          color: isDark
                            ? "rgba(255, 241, 181, 0.82)"
                            : "rgba(35, 31, 32, 0.58)",
                        }}
                      >
                        {getPlaceCategory(place)}
                      </p>

                      <span
                        className="rounded-full px-4 py-2 text-xs font-black shadow-sm"
                        style={{
                          backgroundColor: "rgba(255, 241, 181, 0.72)",
                          color: palette.ink,
                        }}
                      >
                        {isActive ? "Tap to flip" : `#${index + 1}`}
                      </span>
                    </div>

                    <div>
                      <h2
                        className={`font-black leading-none ${
                          isActive
                            ? "line-clamp-3 text-4xl sm:text-5xl lg:text-6xl"
                            : "line-clamp-1 text-2xl sm:text-3xl"
                        }`}
                        style={{
                          color: isDark ? palette.butter : palette.ink,
                        }}
                      >
                        {getPlaceName(place, index)}
                      </h2>

                      {isActive ? (
                        <p
                          className="mt-5 line-clamp-2 text-sm leading-6 sm:text-base"
                          style={{
                            color: isDark
                              ? "rgba(255, 241, 181, 0.78)"
                              : "rgba(35, 31, 32, 0.62)",
                          }}
                        >
                          {getPlaceDescription(place)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  className="absolute inset-0 overflow-hidden rounded-[2rem] p-6 shadow-sm"
                  style={{
                    backgroundColor: palette.butter,
                    color: palette.ink,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    boxShadow: "0 24px 55px rgba(35, 31, 32, 0.20)",
                  }}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <p
                        className="text-xs font-black uppercase tracking-[0.22em]"
                        style={{ color: palette.blossom }}
                      >
                        Place details
                      </p>

                      <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                        {getPlaceName(place, index)}
                      </h2>

                      <p className="mt-5 text-sm leading-6 opacity-70 sm:text-base">
                        {getPlaceDescription(place)}
                      </p>
                    </div>

                    <div>
                      <Link
                        href={`/app/place/${place.id}?from=${encodeURIComponent(
                          `/app/lists/${listId}`,
                        )}`}
                        onPointerDown={(event) => event.stopPropagation()}
                        onPointerUp={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                        className="flex w-full items-center justify-center rounded-full px-5 py-4 text-sm font-black"
                        style={{
                          backgroundColor: palette.forest,
                          color: palette.butter,
                        }}
                      >
                        Open place
                      </Link>

                      <p className="mt-3 text-center text-xs font-bold opacity-50">
                        Tap card again to flip back
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <aside
        className="hidden rounded-[2.5rem] p-6 shadow-sm sm:p-8 lg:block"
        style={{
          backgroundColor: activeColour,
          boxShadow: "0 24px 80px rgba(87, 85, 39, 0.12)",
        }}
      >
        <p
          className="text-sm font-black"
          style={{
            color: activeIsDark ? "rgba(255, 241, 181, 0.78)" : palette.blossom,
          }}
        >
          Selected place
        </p>

        <h2
          className="mt-2 text-4xl font-black leading-tight"
          style={{ color: activeTextColour }}
        >
          {getPlaceName(activePlace, activeIndex)}
        </h2>

        <p className="mt-3 text-sm font-bold" style={{ color: activeMutedTextColour }}>
          {getPlaceCategory(activePlace)}
        </p>

        <p className="mt-5 text-sm leading-6" style={{ color: activeMutedTextColour }}>
          {getPlaceDescription(activePlace)}
        </p>

        <Link
          href={`/app/place/${activePlace.id}?from=${encodeURIComponent(`/app/lists/${listId}`)}`}
          className="mt-8 inline-flex rounded-full px-6 py-4 text-sm font-black shadow-sm"
          style={{
            backgroundColor: activeIsDark ? palette.butter : palette.forest,
            color: activeIsDark ? palette.ink : palette.butter,
          }}
        >
          View full place
        </Link>
      </aside>
    </section>
  );
}