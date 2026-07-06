import { FoodMapApp } from "@/components/FoodMapApp";
import { getFoodLists } from "@/lib/data/lists";
import { getAllFoodPlaces } from "@/lib/data/places";

export const dynamic = "force-dynamic";

export default async function MapPage({
  searchParams
}: {
  searchParams: Promise<{ lists?: string; place?: string }>;
}) {
  const params = await searchParams;
  const initialSelectedListIds = params.lists?.split(",").filter(Boolean);
  const [foodLists, foodPlaces] = await Promise.all([getFoodLists(), getAllFoodPlaces()]);

  return (
    <FoodMapApp
      foodLists={foodLists}
      foodPlaces={foodPlaces}
      initialSelectedListIds={initialSelectedListIds}
      initialFocusedPlaceId={params.place}
    />
  );
}
