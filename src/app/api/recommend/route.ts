import { NextRequest, NextResponse } from "next/server";
import { recommendPlaces } from "@/utils/recommendations";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    query?: string;
    selectedListIds?: unknown;
  };

  if (!body.query?.trim()) {
    return NextResponse.json({ error: "Missing query." }, { status: 400 });
  }

  const selectedListIds = Array.isArray(body.selectedListIds)
    ? [
        ...new Set(
          body.selectedListIds.filter(
            (listId): listId is string => typeof listId === "string" && Boolean(listId.trim())
          )
        )
      ]
    : ["list_my"];
  const result = await recommendPlaces(body.query, selectedListIds);

  return NextResponse.json(result);
}
