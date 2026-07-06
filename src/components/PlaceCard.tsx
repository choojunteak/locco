"use client";

import Link from "next/link";
import type { FoodList, MergedPlace, RecommendationResult } from "@/types";
import { formatDistance } from "@/utils/distance";
import { appleMapsLink, googleMapsLink } from "@/utils/places";
import { FriendAvatarStack } from "@/components/FriendAvatarStack";
import { TagChip } from "@/components/TagChip";

type Props = {
  place: MergedPlace | RecommendationResult;
  lists?: FoodList[];
  href?: string;
  onSelect?: (place: MergedPlace) => void;
  isLarge?: boolean;
};

export function PlaceCard({ place, lists, href, onSelect, isLarge }: Props) {
  const distance = "distanceMeters" in place ? formatDistance(place.distanceMeters) : null;
  const isClickable = Boolean(onSelect || href);
  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-tomato">
            {place.categories[0]} · {place.priceRange}
            {distance ? ` · ${distance}` : ""}
          </p>
          <h3 className={`${isLarge ? "text-3xl" : "text-lg"} mt-1 font-black text-ink`}>
            {place.name}
          </h3>
          <p className="mt-1 text-sm leading-5 text-stone-600">{place.address}</p>
        </div>
        <FriendAvatarStack listIds={place.selectedListIds} lists={lists} />
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-700">{place.notes}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[...place.categories, ...place.moodTags].slice(0, isLarge ? 12 : 5).map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-stone-500">
        Saved by {place.savedBySelected.join(", ")}
      </p>
    </>
  );

  return (
    <article
      className={`rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200 ${
        isClickable ? "transition hover:-translate-y-0.5 hover:shadow-soft" : ""
      }`}
    >
      {href && !onSelect ? (
        <Link
          href={href}
          className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-300"
        >
          {cardBody}
        </Link>
      ) : onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(place)}
          className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-300"
        >
          {cardBody}
        </button>
      ) : (
        <div>{cardBody}</div>
      )}

      {isLarge ? (
        <div className="mt-5 space-y-3">
          <div>
            <h4 className="text-sm font-black text-ink">Comments</h4>
            {place.comments.map((comment) => (
              <p key={`${comment.author}-${comment.text}`} className="mt-2 text-sm text-stone-600">
                <span className="font-bold text-ink">{comment.author}:</span> {comment.text}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {place.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-stone-100 px-3 py-2 text-xs font-bold text-stone-700"
              >
                {source.type}
              </a>
            ))}
            <a
              href={googleMapsLink(place)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-ink px-3 py-2 text-xs font-bold text-white"
            >
              Google Maps
            </a>
            <a
              href={appleMapsLink(place)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-3 py-2 text-xs font-bold text-ink ring-1 ring-stone-200"
            >
              Apple Maps
            </a>
          </div>
          <Link href={`/app/place/${place.id}`} className="inline-flex text-sm font-bold text-tomato">
            Permanent place page
          </Link>
        </div>
      ) : null}
    </article>
  );
}
