"use client";

import type { PlaceStatus } from "@/types";

type Props = {
  status: PlaceStatus;
  isSaved?: boolean;
  isBusy?: boolean;
  size?: "sm" | "md";
  className?: string;
  onSelectStatus?: (status: PlaceStatus) => void;
};

const options: Array<{ status: PlaceStatus; label: string }> = [
  { status: "want_to_try", label: "Want to try" },
  { status: "visited", label: "Visited" }
];

function statusLabel(status: PlaceStatus) {
  return status === "visited" ? "Visited" : "Want to try";
}

export function PlaceSaveStatusControls({
  status,
  isSaved = true,
  isBusy = false,
  size = "md",
  className = "",
  onSelectStatus
}: Props) {
  const canSelect = Boolean(onSelectStatus);
  const baseSize = size === "sm" ? "px-2.5 py-2 text-[11px]" : "px-3 py-2.5 text-xs";
  const markerSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} aria-label="Save status">
      {options.map((option) => {
        const isActive = isSaved && option.status === status;
        const label = isActive ? `Saved: ${statusLabel(option.status)}` : option.label;
        const className = `${baseSize} inline-flex items-center gap-2 rounded-full font-black shadow-sm transition ${
          isActive
            ? "bg-ink text-white ring-1 ring-ink"
            : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-[#FFF1B5]/70"
        } ${canSelect ? "disabled:cursor-wait disabled:opacity-70" : "cursor-default"}`;
        const content = (
          <>
            <span
              aria-hidden="true"
              className={`${markerSize} inline-flex shrink-0 items-center justify-center rounded-full border ${
                isActive
                  ? "border-white bg-white/20"
                  : option.status === "want_to_try"
                    ? "border-[#B97D7B] bg-[#ECC4C3]/70"
                    : "border-[#575527] bg-[#FFF1B5]"
              }`}
            >
              <span
                className={`block ${
                  option.status === "want_to_try"
                    ? "h-1.5 w-1.5 rounded-full bg-[#B97D7B]"
                    : "h-2 w-1 rotate-45 border-b-2 border-r-2 border-current"
                }`}
              />
            </span>
            <span>{label}</span>
          </>
        );

        if (!canSelect) {
          return (
            <span key={option.status} className={className} aria-current={isActive ? "true" : undefined}>
              {content}
            </span>
          );
        }

        return (
          <button
            key={option.status}
            type="button"
            onClick={() => onSelectStatus?.(option.status)}
            disabled={isBusy || !canSelect}
            className={className}
            aria-pressed={isActive}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
