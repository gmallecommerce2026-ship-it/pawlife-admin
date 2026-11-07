import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Pawlife-Shelter/1.0 (lienhe@yourdomain.com)",
        "Accept-Language": "vi",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Nominatim ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error("Reverse geocode proxy error:", error);
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 500 });
  }
}