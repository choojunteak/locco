"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { PlaceStatus } from "@/types";

type SaveStatusSheetMode = "create" | "edit";

type Props = {
  isOpen: boolean;
  mode: SaveStatusSheetMode;
  placeName: string;
  initialStatus: PlaceStatus;
  initialNote?: string;
  initialRating?: number | null;
  isSaving?: boolean;
  isRemoving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (status: PlaceStatus, note: string, rating: number | null) => void;
  onRemove?: () => void;
};

const statusOptions: Array<{ value: PlaceStatus; label: string; description: string }> = [
  {
    value: "want_to_try",
    label: "Want to try",
    description: "Save this for a future meal."
  },
  {
    value: "visited",
    label: "Visited",
    description: "Mark it as somewhere you have been."
  }
];

const ratingOptions = [
  { value: 1, label: "Disliked" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Liked" },
  { value: 5, label: "Favourite" }
];

function statusLabel(status: PlaceStatus) {
  return status === "visited" ? "Visited" : "Want to try";
}

export function SaveStatusSheet({
  isOpen,
  mode,
  placeName,
  initialStatus,
  initialNote = "",
  initialRating = null,
  isSaving = false,
  isRemoving = false,
  error,
  onClose,
  onSave,
  onRemove
}: Props) {
  const [status, setStatus] = useState<PlaceStatus>(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [rating, setRating] = useState<number | null>(initialRating);

  useEffect(() => {
    if (!isOpen) return;
    setStatus(initialStatus);
    setNote(initialNote);
    setRating(initialRating);
  }, [initialNote, initialRating, initialStatus, isOpen]);

  if (!isOpen) return null;

  const isBusy = isSaving || isRemoving;
  const title = mode === "edit" ? "Edit saved place" : `Save as ${statusLabel(status)}`;
  const submitLabel = isSaving
    ? "Saving..."
    : mode === "edit"
      ? "Save changes"
      : `Save ${statusLabel(status)}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    onSave(status, note, status === "visited" ? rating : null);
  }

  return (
    <div className="fixed inset-0 z-[80] bg-ink/25 px-3 py-4" onClick={onClose}>
      <section
        className="absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-lg bg-cream p-4 shadow-soft ring-1 ring-stone-200 sm:bottom-4 sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
        aria-modal="true"
        role="dialog"
        aria-labelledby="save-status-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-tomato">
              {mode === "edit" ? "Your save" : "Confirm save"}
            </p>
            <h2 id="save-status-title" className="mt-1 text-2xl font-black leading-tight text-ink">
              {title}
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-stone-600">{placeName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="shrink-0 rounded-full bg-white px-3 py-2 text-sm font-black text-stone-600 shadow-sm ring-1 ring-stone-200 disabled:cursor-wait disabled:opacity-60"
            aria-label="Close save status sheet"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-white p-1 ring-1 ring-stone-200">
            {statusOptions.map((option) => {
              const isSelected = status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  disabled={isBusy}
                  className={`rounded-full px-3 py-3 text-sm font-black transition disabled:cursor-wait ${
                    isSelected
                      ? "bg-ink text-white shadow-sm"
                      : "text-stone-600 hover:bg-[#FFF1B5]/60"
                  }`}
                  aria-pressed={isSelected}
                  title={option.description}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {status === "visited" ? (
            <div className="grid gap-2">
              <p className="text-sm font-bold text-stone-700">How was it?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ratingOptions.map((option) => {
                  const isSelected = rating === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRating(isSelected ? null : option.value)}
                      disabled={isBusy}
                      className={`rounded-lg px-3 py-3 text-sm font-black ring-1 transition disabled:cursor-wait disabled:opacity-60 ${
                        isSelected
                          ? "bg-ink text-white ring-ink"
                          : "bg-white text-stone-700 ring-stone-200 hover:bg-[#FFF1B5]/60"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-bold text-stone-700">
            Personal note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isBusy}
              maxLength={1000}
              placeholder={status === "visited" ? "What did you think?" : "What do you want to try?"}
              className="min-h-28 resize-none rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm font-normal text-ink outline-none transition placeholder:text-stone-400 focus:border-tomato focus:ring-2 focus:ring-[#ECC4C3]/50 disabled:cursor-wait disabled:opacity-60"
            />
          </label>

          {error ? <p className="text-sm font-semibold text-tomato">{error}</p> : null}

          <div className="grid gap-2">
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-full bg-tomato px-5 py-3 text-sm font-black text-white shadow-soft disabled:cursor-wait disabled:opacity-70"
            >
              {submitLabel}
            </button>
            {mode === "edit" && onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                disabled={isBusy}
                className="rounded-full bg-white px-5 py-3 text-sm font-black text-tomato ring-1 ring-tomato disabled:cursor-wait disabled:opacity-70"
              >
                {isRemoving ? "Removing..." : "Remove from my saved places"}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
