"use server";

import { searchDiscover } from "@/lib/data/discover";

export async function searchDiscoverAction(query: string) {
  return searchDiscover(query);
}
