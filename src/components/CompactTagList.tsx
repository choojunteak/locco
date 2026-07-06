"use client";

import { useState } from "react";
import type { FoodCategory, MoodTag } from "@/types";
import { getCompactPlaceTags } from "@/utils/places";
import { TagChip } from "@/components/TagChip";

type Props = {
  categories: FoodCategory[];
  moodTags: MoodTag[];
  limit?: number;
  isOverflowInteractive?: boolean;
};

export function CompactTagList({
  categories,
  moodTags,
  limit = 4,
  isOverflowInteractive = true
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { visibleTags, hiddenTags, hiddenCount } = getCompactPlaceTags(categories, moodTags, limit);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
        {hiddenCount && isOverflowInteractive ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-full bg-[#FFF1B5] px-3 py-1.5 text-xs font-bold text-ink ring-1 ring-[#ECC4C3]"
          >
            +{hiddenCount} more
          </button>
        ) : hiddenCount ? (
          <span className="rounded-full bg-[#FFF1B5] px-3 py-1.5 text-xs font-bold text-ink ring-1 ring-[#ECC4C3]">
            +{hiddenCount} more
          </span>
        ) : null}
      </div>

      {isOpen && isOverflowInteractive ? (
        <div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-ink/25 px-4 pb-4 backdrop-blur-[2px] sm:items-center sm:pb-0"
          onClick={() => setIsOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="All place tags"
            className="w-full max-w-sm rounded-[2rem] bg-white/95 p-5 shadow-soft ring-1 ring-white/70"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-ink">All tags</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-600"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[...visibleTags, ...hiddenTags].map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
