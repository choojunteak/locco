import { foodLists } from "@/data/mockData";
import type { FoodList } from "@/types";

export function FriendAvatarStack({
  listIds,
  lists = foodLists
}: {
  listIds: string[];
  lists?: FoodList[];
}) {
  const visibleLists = listIds.map((id) => lists.find((list) => list.id === id)).filter(Boolean);

  return (
    <div className="flex -space-x-2">
      {visibleLists.map((list) => (
        <div
          key={list!.id}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white"
          style={{ backgroundColor: list!.color }}
          title={list!.name}
        >
          {list!.avatar}
        </div>
      ))}
    </div>
  );
}
