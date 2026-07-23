import { NextRequest, NextResponse } from "next/server";
import {
  activeLocationSearchAdapter,
  searchKnownLocations,
  searchLocations
} from "@/lib/location-search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query parameter." }, { status: 400 });
  }

  const providerName = activeLocationSearchAdapter.provider.displayName;

  try {
    const results = await searchLocations(query);
    return NextResponse.json({ results });
  } catch (error) {
    const fallback = searchKnownLocations(query);
    if (fallback.length > 0) {
      return NextResponse.json({
        results: fallback,
        warning: `Using local fallback results because ${providerName} was unavailable.`
      });
    }

    return NextResponse.json(
      {
        error: `Unable to search ${providerName} right now.`,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}
