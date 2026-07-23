"use client";

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import type { FoodList } from "@/types";

type Props = {
  lists: FoodList[];
  appliedListIds: string[];
  isOpen: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSelectionChange: (listIds: string[]) => void;
};

type OwnerGroup = {
  key: string;
  label: string;
  lists: FoodList[];
  defaultExpanded: boolean;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

export function MapFiltersSheet({
  lists,
  appliedListIds,
  isOpen,
  triggerRef,
  onClose,
  onSelectionChange
}: Props) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const disclosureBaseId = useId();
  const selectedListIds = appliedListIds;
  const ownerGroups = useMemo<OwnerGroup[]>(() => {
    const groups: OwnerGroup[] = [];
    const yourLists = lists.filter((list) => list.isMine);
    const friendListsByName = new Map<string, FoodList[]>();

    lists
      .filter((list) => !list.isMine)
      .forEach((list) => {
        const current = friendListsByName.get(list.ownerName) ?? [];
        friendListsByName.set(list.ownerName, [...current, list]);
      });

    if (yourLists.length) {
      groups.push({
        key: "your-lists",
        label: "Your lists",
        lists: yourLists,
        defaultExpanded: true
      });
    }

    [...friendListsByName.entries()].forEach(([ownerName, ownerLists], index) => {
      groups.push({
        key: `friend-group-${index}`,
        label: ownerName,
        lists: ownerLists,
        defaultExpanded: false
      });
    });

    return groups;
  }, [lists]);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!isOpen) return;
    setExpandedGroupKeys(
      new Set(ownerGroups.filter((group) => group.defaultExpanded).map((group) => group.key))
    );
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, [isOpen, ownerGroups]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => element.offsetParent !== null && !element.hidden);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const selectedCount = selectedListIds.length;
  const allSelected = Boolean(lists.length) && selectedCount === lists.length;

  function closeSheet() {
    onClose();
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function toggleList(listId: string) {
    const nextIds = selectedListIds.includes(listId)
      ? selectedListIds.filter((id) => id !== listId)
      : [...selectedListIds, listId];
    onSelectionChange(nextIds);
  }

  function toggleGroup(groupKey: string) {
    setExpandedGroupKeys((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/25 px-3 pt-6 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeSheet();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-filters-title"
        tabIndex={-1}
        className="flex max-h-[82dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-soft ring-1 ring-stone-200 sm:rounded-[2rem]"
      >
        <header className="shrink-0 border-b border-stone-200 bg-cream/95 px-4 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#B97D7B]">Map scope</p>
              <h2 id="map-filters-title" className="mt-1 text-2xl font-black text-ink">
                Map filters
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeSheet}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black text-stone-600 shadow-sm ring-1 ring-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97D7B]/50"
              aria-label="Close map filters"
            >
              &times;
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-stone-600">
              {selectedCount} of {lists.length} selected
            </p>
            {lists.length ? (
              <button
                type="button"
                onClick={() =>
                  onSelectionChange(allSelected ? [] : lists.map((list) => list.id))
                }
                className="flex h-10 shrink-0 items-center justify-center rounded-full bg-white px-3 text-xs font-black text-[#575527] ring-1 ring-stone-200 transition hover:bg-[#FFF1B5]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97D7B]/50"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!lists.length ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-stone-600 ring-1 ring-stone-200">
              <p className="font-black text-ink">No lists available</p>
              <p className="mt-1 leading-5">There are no accessible lists to show on the map yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {ownerGroups.map((group, index) => {
                const isExpanded = expandedGroupKeys.has(group.key);
                const groupSelectedCount = group.lists.filter((list) =>
                  selectedListIds.includes(list.id)
                ).length;
                const regionId = `${disclosureBaseId}-group-${index}`;

                return (
                  <section
                    key={group.key}
                    className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className="flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-[#FFF1B5]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B97D7B]/50"
                      aria-expanded={isExpanded}
                      aria-controls={regionId}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-ink">
                          {group.label}
                        </span>
                        <span className="block text-xs font-semibold text-stone-500">
                          {groupSelectedCount} of {group.lists.length}
                        </span>
                      </span>
                      <svg
                        viewBox="0 0 20 20"
                        className={`h-5 w-5 shrink-0 text-stone-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 8 4 4 4-4" />
                      </svg>
                    </button>

                    <div
                      id={regionId}
                      hidden={!isExpanded}
                      className="divide-y divide-stone-200 border-t border-stone-200"
                    >
                      {group.lists.map((list) => {
                        const checked = selectedListIds.includes(list.id);
                        return (
                          <label
                            key={list.id}
                            className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-[#FFF1B5]/25"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleList(list.id)}
                              className="h-5 w-5 shrink-0 accent-[#575527]"
                            />
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: list.color }}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-black text-ink">
                              {list.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
