type Identified = {
  id: string;
};

export type CanonicalPlaceIdRemap = {
  fromId: string;
  toId: string;
  changed: boolean;
  id: (id: string) => string;
  item: <T extends Identified>(item: T | null) => T | null;
  items: <T extends Identified>(items: readonly T[]) => T[];
  idList: (ids: readonly string[]) => string[];
  idSet: (ids: ReadonlySet<string>) => Set<string>;
};

export function createCanonicalPlaceIdRemap(
  fromId: string,
  toId: string
): CanonicalPlaceIdRemap {
  const changed = fromId !== toId;
  const remapId = (id: string) => (changed && id === fromId ? toId : id);

  return {
    fromId,
    toId,
    changed,
    id: remapId,
    item: <T extends Identified>(item: T | null) => {
      if (!item || !changed || item.id !== fromId) return item;
      return { ...item, id: toId };
    },
    items: <T extends Identified>(items: readonly T[]) => {
      if (!changed) return [...items];

      const canonicalAlreadyExists = items.some((item) => item.id === toId);
      const seenIds = new Set<string>();

      return items.flatMap((item) => {
        if (item.id === fromId && canonicalAlreadyExists) return [];

        const nextItem = item.id === fromId ? { ...item, id: toId } : item;
        if (seenIds.has(nextItem.id)) return [];
        seenIds.add(nextItem.id);
        return [nextItem];
      });
    },
    idList: (ids: readonly string[]) => {
      const seenIds = new Set<string>();

      return ids.flatMap((id) => {
        const nextId = remapId(id);
        if (seenIds.has(nextId)) return [];
        seenIds.add(nextId);
        return [nextId];
      });
    },
    idSet: (ids: ReadonlySet<string>) => {
      const nextIds = new Set(ids);
      if (!changed || !nextIds.delete(fromId)) return nextIds;
      nextIds.add(toId);
      return nextIds;
    }
  };
}
