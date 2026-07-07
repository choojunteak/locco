"use client";

import { useState } from "react";
import { DEMO_LIST_ID, DEMO_USER_DISPLAY_NAME } from "@/lib/demoIdentity";
import type { FoodList, FoodPlace, PlaceStatus } from "@/types";

type Props = {
  lists: FoodList[];
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: FoodPlace) => void;
};

const categories = ["Cafe", "Dessert", "Japanese", "Korean", "Local", "Thai", "Bakery", "Cheap Eats"] as const;
const moods = ["Date Spot", "Cheap Eats", "Aesthetic", "Good for Groups", "Solo Meal", "Study Cafe", "Chill"] as const;

export function AddPlaceModal({ lists, isOpen, onClose, onAddPlace }: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Cafe");
  const [moodTag, setMoodTag] = useState<(typeof moods)[number]>("Chill");
  const [priceRange, setPriceRange] = useState<FoodPlace["priceRange"]>("$$");
  const [notes, setNotes] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [listId, setListId] = useState(lists[0]?.id ?? DEMO_LIST_ID);
  const [status, setStatus] = useState<PlaceStatus>("want_to_try");

  if (!isOpen) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const list = lists.find((item) => item.id === listId) ?? lists[0];

    const newPlace: FoodPlace = {
      id: `local-${Date.now()}`,
      name,
      address,
      latitude: 1.30398,
      longitude: 103.83225,
      categories: [category],
      moodTags: [moodTag],
      priceRange,
      notes,
      sources: sourceUrl ? [{ type: sourceUrl.includes("instagram") ? "instagram" : "tiktok", url: sourceUrl }] : [],
      comments: [],
      savedBy: [list?.ownerName ?? DEMO_USER_DISPLAY_NAME],
      listIds: [listId],
      status
    };

    // TODO: Replace this local-only insert with a Supabase saved_places + places insert.
    onAddPlace(newPlace);
    setName("");
    setAddress("");
    setNotes("");
    setSourceUrl("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/30 px-4 py-6">
      <div className="mx-auto max-h-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-tomato">Local mock save</p>
            <h2 className="text-2xl font-black text-ink">Add place</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-100 px-3 py-2 text-sm font-black text-stone-600"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="grid gap-1 text-sm font-bold text-stone-700">
            Place name
            <input required value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-stone-200 px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-bold text-stone-700">
            Address or searched location
            <input required value={address} onChange={(event) => setAddress(event.target.value)} className="rounded-lg border border-stone-200 px-3 py-2 font-normal" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-bold text-stone-700">
              Food category
              <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="rounded-lg border border-stone-200 px-3 py-2 font-normal">
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-stone-700">
              Mood
              <select value={moodTag} onChange={(event) => setMoodTag(event.target.value as typeof moodTag)} className="rounded-lg border border-stone-200 px-3 py-2 font-normal">
                {moods.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-bold text-stone-700">
              Price
              <select value={priceRange} onChange={(event) => setPriceRange(event.target.value as FoodPlace["priceRange"])} className="rounded-lg border border-stone-200 px-3 py-2 font-normal">
                {["$", "$$", "$$$", "$$$$"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-stone-700">
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value as PlaceStatus)} className="rounded-lg border border-stone-200 px-3 py-2 font-normal">
                <option value="want_to_try">Want to Try</option>
                <option value="visited">Visited</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm font-bold text-stone-700">
            TikTok or Instagram link
            <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className="rounded-lg border border-stone-200 px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-bold text-stone-700">
            Save into list
            <select value={listId} onChange={(event) => setListId(event.target.value)} className="rounded-lg border border-stone-200 px-3 py-2 font-normal">
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-stone-700">
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 font-normal" />
          </label>
          <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
            Add locally
          </button>
        </form>
      </div>
    </div>
  );
}
