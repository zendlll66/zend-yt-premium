import { NextRequest, NextResponse } from "next/server";
import { getR2PublicUrl } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key?.trim()) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  const url = getR2PublicUrl(key);
  if (!url) {
    return NextResponse.json({ error: "R2 not configured or invalid key" }, { status: 404 });
  }
  return NextResponse.redirect(url);
}
