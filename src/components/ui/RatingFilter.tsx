// src/components/ui/RatingFilter.tsx
"use client";

import React, { useState } from "react";
import ShootingStarIcon from "@/icons/shooting-star.svg"; // Dùng tạm icon này

const RatingFilter = () => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  return (
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => setSelectedRating(ratingValue)}
            onMouseEnter={() => setHoverRating(ratingValue)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-gray-300"
          >
            <ShootingStarIcon
              className={`w-6 h-6 transition-colors ${
                ratingValue <= (hoverRating || selectedRating)
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingFilter;