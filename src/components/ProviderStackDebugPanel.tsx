"use client";

import type {
  ProviderStackPreference,
  ProviderStackResolution
} from "@/types";

type Props = {
  resolution: ProviderStackResolution;
  preference: ProviderStackPreference;
  onPreferenceChange: (preference: ProviderStackPreference) => void;
};

const markerStates = [
  ["normal", "L"],
  ["want-to-try", "+"],
  ["visited", "✓"],
  ["highlighted", "★"],
  ["selected", "L"],
  ["cluster", "3"],
  ["reference", "◎"]
] as const;

export function ProviderStackDebugPanel({
  resolution,
  preference,
  onPreferenceChange
}: Props) {
  return (
    <aside className="pointer-events-auto absolute left-3 top-[4.75rem] z-30 w-[min(22rem,calc(100%-1.5rem))] rounded-2xl bg-white/95 p-3 shadow-soft ring-1 ring-stone-200 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#928E5E]">
            Development only
          </p>
          <p className="mt-0.5 text-xs font-bold text-ink">
            {resolution.stack.id} / {resolution.reason}
          </p>
        </div>
        <div className="flex rounded-full bg-stone-100 p-1">
          {(["auto", "google", "fallback"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPreferenceChange(option)}
              className={`rounded-full px-2 py-1 text-[10px] font-black capitalize ${
                preference === option ? "bg-ink text-white" : "text-stone-500"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2" aria-label="Locco marker state preview">
        {markerStates.map(([state, glyph]) => (
          <div key={state} className="flex flex-col items-center gap-1">
            <span className={`locco-map-marker locco-map-marker--${state}`}>
              <span className="locco-map-marker__face" aria-hidden="true">
                {glyph}
              </span>
            </span>
            <span className="text-[8px] font-bold text-stone-500">{state}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
