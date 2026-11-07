// src/lib/admin/rating.ts
import { db } from "@/lib/db";

/** Tính lại điểm đánh giá của địa điểm, chỉ tính các đánh giá chưa bị gỡ */
export async function recalcPlaceRating(placeId: string) {
  const agg = await db.placeReview.aggregate({
    where: { placeId, isRemoved: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await db.place.update({
    where: { id: placeId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });
}
