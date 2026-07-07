"use client";

import Link from "next/link";
import type { FoodList, MergedPlace, PlaceStatus } from "@/types";
import { formatDistance } from "@/utils/distance";
import { placeSourceLabel } from "@/utils/places";
import { CompactTagList } from "@/components/CompactTagList";
import { DirectionsAction } from "@/components/DirectionsAction";
import { FriendAvatarStack } from "@/components/FriendAvatarStack";
import { PlaceSaveStatusControls } from "@/components/PlaceSaveStatusControls";

type Props = {
  place: MergedPlace | null;
  lists?: FoodList[];
  distanceMeters?: number;
  onClose: () => void;
  onStartSave: (status: PlaceStatus) => void;
  isSaving?: boolean;
  isUnsaving?: boolean;
  isSaved?: boolean;
  saveError?: string | null;
  onViewRecommendations?: () => void;
};

export function PlaceBottomSheet({
  place,
  lists,
  distanceMeters,
  onClose,
  onStartSave,
  isSaving = false,
  isUnsaving = false,
  isSaved = false,
  saveError,
  onViewRecommendations
}: Props) {
  if (!place) return null;
  const distance = formatDistance(distanceMeters);
  const isSaveActionBusy = isSaving || isUnsaving;

  return (
    <section className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[48dvh] max-w-xl overflow-y-auto rounded-t-lg bg-white p-4 shadow-soft ring-1 ring-stone-200 bottom-sheet-scroll sm:bottom-4 sm:max-h-[56dvh] sm:rounded-lg">
      <div className="mb-2 flex items-center justify-between gap-3">
        {onViewRecommendations ? (
          <button
            type="button"
            onClick={onViewRecommendations}
            className="text-xs font-black text-tomato underline-offset-4 hover:underline"
          >
            &larr; Recommendations
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-stone-100 px-3 py-2 text-sm font-black text-stone-600"
          aria-label="Close place details"
        >
          X
        </button>
      </div>

      <div className="mb-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-tomato">
            {place.categories[0]} - {place.priceRange}
            {distance ? ` - ${distance}` : ""}
          </p>
          <h2 className="mt-1 text-xl font-black leading-tight text-ink">{place.name}</h2>
          <p className="mt-1 text-sm leading-5 text-stone-600">{place.address}</p>
          <PlaceSaveStatusControls
            status={place.status}
            isSaved={isSaved}
            isBusy={isSaveActionBusy}
            onSelectStatus={onStartSave}
            className="mt-3"
          />
        </div>
      </div>

      {place.savedBySelected.length ? (
        <section className="mt-3 border-t border-stone-100 pt-3">
          <div className="flex items-center gap-3">
            <FriendAvatarStack listIds={place.selectedListIds} lists={lists} />
            <p className="text-sm font-semibold text-stone-600">
              Saved by {place.savedBySelected.join(", ")}
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-3 border-t border-stone-100 pt-3">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">Notes</p>
        <p className="mt-1 text-sm leading-6 text-stone-700">{place.notes}</p>
      </section>

      <section className="mt-3 border-t border-stone-100 pt-3">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">Tags</p>
        <div className="mt-2">
          <CompactTagList categories={place.categories} moodTags={place.moodTags} limit={4} />
        </div>
      </section>

      <section className="mt-3 border-t border-stone-100 pt-3">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">Actions</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <DirectionsAction place={place} />
          <Link
            href={`/app/place/${place.id}`}
            className="rounded-full bg-stone-100 px-3 py-2 text-xs font-bold text-stone-700"
          >
            Details
          </Link>
        </div>
        {saveError ? (
          <p className="mt-2 text-xs font-semibold text-tomato">{saveError}</p>
        ) : null}
      </section>

      {place.comments.length ? (
        <section className="mt-3 space-y-2 border-t border-stone-100 pt-3">
          <p className="text-xs font-black uppercase tracking-wide text-stone-400">Comments</p>
          {place.comments.map((comment) => (
            <p key={`${comment.author}-${comment.text}`} className="text-sm text-stone-600">
              <span className="font-bold text-ink">{comment.author}:</span> {comment.text}
            </p>
          ))}
        </section>
      ) : null}

      {place.sources.length ? (
        <section className="mt-3 border-t border-stone-100 pt-3">
          <p className="text-xs font-black uppercase tracking-wide text-stone-400">Sources</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {place.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-tomato underline"
              >
                {placeSourceLabel(source)}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
