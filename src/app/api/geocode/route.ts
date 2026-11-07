import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=vn&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        // Bắt buộc phải có, nếu không Nominatim trả về 403
        "User-Agent": "Pawlife-Shelter/1.0 (lienhe@yourdomain.com)",
        "Accept-Language": "vi",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Nominatim ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error("Geocode proxy error:", error);
    return NextResponse.json({ error: "Geocode failed" }, { status: 500 });
  }
}