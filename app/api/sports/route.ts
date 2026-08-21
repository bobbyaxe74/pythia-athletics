import { NextResponse } from "next/server";
import { listSports } from "@/lib/sports/registry";

export async function GET() {
  const sports = listSports().map(({ id, label }) => ({ id, label }));
  return NextResponse.json({ sports });
}
