"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type PanInfo
} from "motion/react";
import type { FoodList, MergedPlace, PlaceStatus } from "@/types";
import { formatDistance } from "@/utils/distance";
import { placeSourceLabel } from "@/utils/places";
import { CompactTagList } from "@/components/CompactTagList";
import { DirectionsAction } from "@/components/DirectionsAction";
import { FriendAvatarStack } from "@/components/FriendAvatarStack";
import { PlaceSaveStatusControls } from "@/components/PlaceSaveStatusControls";

export type PlaceSheetSnapState = "minimized" | "mid" | "expanded";

type Props = {
  place: MergedPlace | null;
  lists?: FoodList[];
  distanceMeters?: number;
  snapState: PlaceSheetSnapState;
  onSnapStateChange: (snapState: PlaceSheetSnapState) => void;
  onClose: () => void;
  onStartSave: (status: PlaceStatus) => void;
  isSaving?: boolean;
  isUnsaving?: boolean;
  isSaved?: boolean;
  saveError?: string | null;
  onViewRecommendations?: () => void;
};

const snapOrder: PlaceSheetSnapState[] = ["minimized", "mid", "expanded"];
const closePullDistance = 64;
const releaseProjectionMs = 180;
// Keeps the current search/list controls clear until that top UI gets redesigned.
const expandedTopReservePx = 144;
const minimizedHeightMinPx = 132;
const minimizedHeightMaxPx = 190;
const minimizedContentReservePx = 18;

type SheetMetrics = {
  height: Record<PlaceSheetSnapState, number>;
  offset: Record<PlaceSheetSnapState, number>;
};

const snapTransition = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.9
} as const;

function statusLabel(status: PlaceStatus) {
  return status === "visited" ? "Visited" : "Want to try";
}

function saveSummary(place: MergedPlace, isSaved: boolean) {
  if (isSaved) {
    return statusLabel(place.status);
  }

  const saveCount = place.savedBySelected.length;
  if (saveCount) {
    return `${saveCount} trusted save${saveCount === 1 ? "" : "s"}`;
  }

  return "Not saved yet";
}

function nextSnapState(current: PlaceSheetSnapState) {
  const currentIndex = snapOrder.indexOf(current);
  return snapOrder[Math.min(snapOrder.length - 1, currentIndex + 1)];
}

function defaultMinimizedHeight() {
  if (typeof window === "undefined") {
    return 140;
  }

  return window.innerWidth >= 640 ? 144 : 140;
}

function getSheetMetrics(minimizedHeight = defaultMinimizedHeight()): SheetMetrics {
  if (typeof window === "undefined") {
    const expanded = 640;
    return {
      height: { minimized: minimizedHeight, mid: 304, expanded },
      offset: { expanded: 0, mid: expanded - 304, minimized: expanded - minimizedHeight }
    };
  }

  const viewportHeight = window.innerHeight;
  const isWide = window.innerWidth >= 640;
  const minimized = clamp(minimizedHeight, minimizedHeightMinPx, minimizedHeightMaxPx);
  const preferredMid = viewportHeight * (isWide ? 0.41 : 0.38);
  const maxMid = isWide ? viewportHeight * 0.41 : 352;
  const preferredExpanded = isWide
    ? Math.min(viewportHeight * 0.78, viewportHeight - expandedTopReservePx)
    : viewportHeight - expandedTopReservePx;
  const expanded = Math.round(Math.min(704, Math.max(minimized + 180, preferredExpanded)));
  const mid = Math.round(
    Math.max(minimized + 88, Math.min(expanded - 88, Math.min(maxMid, Math.max(256, preferredMid))))
  );

  return {
    height: {
      minimized,
      mid,
      expanded
    },
    offset: {
      expanded: 0,
      mid: expanded - mid,
      minimized: expanded - minimized
    }
  };
}

function nearestSnapState(offset: number, metrics: SheetMetrics) {
  return snapOrder.reduce((nearest, snapState) => {
    const nearestDistance = Math.abs(metrics.offset[nearest] - offset);
    const snapDistance = Math.abs(metrics.offset[snapState] - offset);
    return snapDistance < nearestDistance ? snapState : nearest;
  }, "mid" as PlaceSheetSnapState);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function PlaceBottomSheet({
  place,
  lists,
  distanceMeters,
  snapState,
  onSnapStateChange,
  onClose,
  onStartSave,
  isSaving = false,
  isUnsaving = false,
  isSaved = false,
  saveError,
  onViewRecommendations
}: Props) {
  const compactContentRef = useRef<HTMLDivElement | null>(null);
  const [measuredMinimizedHeight, setMeasuredMinimizedHeight] = useState(defaultMinimizedHeight);
  const [metrics, setMetrics] = useState(() => getSheetMetrics(defaultMinimizedHeight()));
  const dragControls = useDragControls();
  const y = useMotionValue(metrics.offset[snapState]);
  const didDragRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const minToMidDistance = metrics.offset.minimized - metrics.offset.mid;
  const detailOpacity = useTransform(y, [metrics.offset.mid, metrics.offset.minimized], [1, 0]);
  const compactActionOpacity = useTransform(
    y,
    [metrics.offset.mid, metrics.offset.mid + minToMidDistance * 0.35],
    [0, 1]
  );
  const compactActionScale = useTransform(compactActionOpacity, [0, 1], [0.96, 1]);
  const bottomActionOpacity = useTransform(
    y,
    [metrics.offset.mid + minToMidDistance * 0.34, metrics.offset.mid + minToMidDistance * 0.76],
    [1, 0]
  );
  const bottomActionY = useTransform(y, (latest) => -latest);

  useEffect(() => {
    if (isDragging) return;

    function measureMinimizedHeight() {
      const compactContent = compactContentRef.current;
      if (!compactContent) return;

      const measuredHeight = compactContent.getBoundingClientRect().height;
      const nextHeight = Math.round(
        clamp(
          measuredHeight + minimizedContentReservePx,
          minimizedHeightMinPx,
          minimizedHeightMaxPx
        )
      );
      setMeasuredMinimizedHeight((current) => (current === nextHeight ? current : nextHeight));
    }

    measureMinimizedHeight();
    window.addEventListener("resize", measureMinimizedHeight);

    const compactContent = compactContentRef.current;
    const resizeObserver =
      compactContent && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measureMinimizedHeight)
        : null;

    if (compactContent && resizeObserver) {
      resizeObserver.observe(compactContent);
    }

    return () => {
      window.removeEventListener("resize", measureMinimizedHeight);
      resizeObserver?.disconnect();
    };
  }, [distanceMeters, isDragging, isSaved, place]);

  useEffect(() => {
    if (isDragging) return;

    function handleResize() {
      setMetrics(getSheetMetrics(measuredMinimizedHeight));
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragging, measuredMinimizedHeight]);

  useEffect(() => {
    if (isDragging) return;
    const controls = animate(y, metrics.offset[snapState], snapTransition);
    return () => controls.stop();
  }, [isDragging, metrics, snapState, y]);

  if (!place) return null;

  const distance = formatDistance(distanceMeters);
  const isSaveActionBusy = isSaving || isUnsaving;
  const isMinimized = snapState === "minimized";
  const summary = saveSummary(place, isSaved);

  function startSheetDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    didDragRef.current = false;
    dragControls.start(event);
  }

  function settleToSnap(nextSnap: PlaceSheetSnapState) {
    onSnapStateChange(nextSnap);
    animate(y, metrics.offset[nextSnap], snapTransition);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const releasedOffset = y.get();
    const minimizedOffset = metrics.offset.minimized;
    const releaseVelocity = info.velocity.y;
    setIsDragging(false);
    didDragRef.current = Math.abs(info.offset.y) > 6;

    if (
      releasedOffset > minimizedOffset + closePullDistance ||
      (snapState === "minimized" && (info.offset.y > 88 || releaseVelocity > 900))
    ) {
      onClose();
      return;
    }

    const projectedOffset = clamp(
      releasedOffset + releaseVelocity * (releaseProjectionMs / 1000),
      metrics.offset.expanded,
      minimizedOffset
    );
    settleToSnap(nearestSnapState(projectedOffset, metrics));
  }

  function handleHandleClick() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    settleToSnap(snapState === "expanded" ? "mid" : nextSnapState(snapState));
  }

  function handleSummaryClick() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    if (isMinimized) {
      settleToSnap("mid");
    }
  }

  return (
    <motion.section
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{
        top: metrics.offset.expanded,
        bottom: metrics.offset.minimized + closePullDistance + 96
      }}
      dragElastic={0.08}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col overflow-hidden rounded-[1.75rem] bg-white/95 shadow-soft ring-1 ring-stone-200/80 backdrop-blur will-change-transform sm:bottom-4"
      style={{ height: metrics.height.expanded, y }}
      aria-label={`${place.name} place details`}
    >
      <button type="button" onClick={onClose} className="sr-only">
        Close place details
      </button>

      <div ref={compactContentRef} className="shrink-0">
        <div className="px-4 pt-1.5">
          <button
            type="button"
            onPointerDown={startSheetDrag}
            onClick={handleHandleClick}
            className={`mx-auto flex h-5 w-20 touch-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97D7B]/50 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            aria-label={snapState === "expanded" ? "Collapse place sheet" : "Expand place sheet"}
          >
            <span
              className={`h-1 w-10 rounded-full transition ${
                isDragging ? "bg-[#B97D7B]" : "bg-stone-300 hover:bg-stone-400"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="relative flex items-start gap-3 px-4 pb-2">
          <button
            type="button"
            onPointerDown={startSheetDrag}
            onClick={handleSummaryClick}
            className="min-w-0 flex-1 touch-none pr-[7rem] text-left"
            aria-label={isMinimized ? "Open place summary" : undefined}
          >
            <p className="text-[11px] font-black uppercase tracking-wide text-tomato">
              {place.categories[0]} - {place.priceRange}
              {distance ? ` - ${distance}` : ""}
            </p>
            <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-ink">
              {place.name}
            </h2>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-stone-500">
              {summary}
            </p>
          </button>
          <motion.div
            className={`absolute right-4 top-0 flex w-[6.5rem] justify-end ${
              !isMinimized || isDragging ? "pointer-events-none" : ""
            }`}
            style={{ opacity: compactActionOpacity, scale: compactActionScale }}
            aria-hidden={!isMinimized || isDragging}
          >
            <DirectionsAction
              place={place}
              className="rounded-full bg-ink px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
            />
          </motion.div>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-hidden ${
          isMinimized && !isDragging ? "pointer-events-none" : ""
        }`}
        aria-hidden={isMinimized && !isDragging}
      >
        <div className="flex h-full min-h-0 flex-col">
          <motion.div
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-1 bottom-sheet-scroll"
            style={{ opacity: detailOpacity }}
          >
            <div className="rounded-2xl bg-[#FFF1B5]/40 p-3 ring-1 ring-[#ECC4C3]/60">
              <p className="text-sm leading-5 text-stone-700">{place.address}</p>
              <PlaceSaveStatusControls
                status={place.status}
                isSaved={isSaved}
                isBusy={isSaveActionBusy}
                onSelectStatus={onStartSave}
                className="mt-3"
              />
            </div>

            {place.savedBySelected.length ? (
              <section className="mt-4 border-t border-stone-100 pt-4">
                <div className="flex items-center gap-3">
                  <FriendAvatarStack listIds={place.selectedListIds} lists={lists} />
                  <p className="text-sm font-semibold text-stone-600">
                    Saved by {place.savedBySelected.join(", ")}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="mt-4 border-t border-stone-100 pt-4">
              <p className="text-xs font-black uppercase tracking-wide text-stone-400">Notes</p>
              <p className="mt-1 text-sm leading-6 text-stone-700">{place.notes}</p>
            </section>

            <section className="mt-4 border-t border-stone-100 pt-4">
              <p className="text-xs font-black uppercase tracking-wide text-stone-400">Tags</p>
              <div className="mt-2">
                <CompactTagList categories={place.categories} moodTags={place.moodTags} limit={4} />
              </div>
            </section>

            {place.comments.length ? (
              <section className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                <p className="text-xs font-black uppercase tracking-wide text-stone-400">Comments</p>
                {place.comments.map((comment) => (
                  <p key={`${comment.author}-${comment.text}`} className="text-sm text-stone-600">
                    <span className="font-bold text-ink">{comment.author}:</span> {comment.text}
                  </p>
                ))}
              </section>
            ) : null}

            {place.sources.length ? (
              <section className="mt-4 border-t border-stone-100 pt-4">
                <p className="text-xs font-black uppercase tracking-wide text-stone-400">Sources</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {place.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-stone-100 px-3 py-2 text-xs font-bold text-stone-700"
                    >
                      {placeSourceLabel(source)}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </motion.div>

          <motion.div
            className={`absolute inset-x-0 bottom-0 shrink-0 border-t border-stone-100 bg-white/95 px-4 py-3 ${
              isMinimized && !isDragging ? "pointer-events-none" : ""
            }`}
            style={{ opacity: bottomActionOpacity, y: bottomActionY }}
            aria-hidden={isMinimized && !isDragging}
          >
            {saveError ? (
              <p className="mb-2 text-xs font-semibold text-tomato">{saveError}</p>
            ) : null}
            <div className="flex items-center gap-3">
              {onViewRecommendations ? (
                <button
                  type="button"
                  onClick={onViewRecommendations}
                  className="shrink-0 rounded-full bg-[#ECC4C3]/80 px-3 py-2.5 text-xs font-black text-ink"
                >
                  Results
                </button>
              ) : null}
              <DirectionsAction
                place={place}
                className="flex-1 rounded-full bg-ink px-4 py-3 text-center text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
              />
              <Link
                href={`/app/place/${place.id}`}
                className="rounded-full bg-stone-100 px-4 py-3 text-xs font-black text-stone-700"
              >
                Details
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
