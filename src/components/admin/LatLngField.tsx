"use client";
// Ô nhập tọa độ + bản đồ chọn điểm. Ghi vào input hidden lat/lng để gửi kèm form.
import { useState } from "react";
import dynamic from "next/dynamic";
import { inputCls, labelCls } from "./ui";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-xl bg-gray-100" />,
});

export default function LatLngField({
  latName = "lat",
  lngName = "lng",
  defaultLat,
  defaultLng,
  required = false,
}: {
  latName?: string;
  lngName?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  required?: boolean;
}) {
  const [lat, setLat] = useState<number | null>(defaultLat ?? null);
  const [lng, setLng] = useState<number | null>(defaultLng ?? null);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelCls}>Vĩ độ</span>
          <input
            className={inputCls}
            type="number"
            step="any"
            required={required}
            value={lat ?? ""}
            onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
        <div>
          <span className={labelCls}>Kinh độ</span>
          <input
            className={inputCls}
            type="number"
            step="any"
            required={required}
            value={lng ?? ""}
            onChange={(e) => setLng(e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
      </div>
      <MapPicker
        lat={lat}
        lng={lng}
        onPick={(a, b) => {
          setLat(Number(a.toFixed(6)));
          setLng(Number(b.toFixed(6)));
        }}
      />
      <p className="text-xs text-gray-400">Click lên bản đồ để chọn vị trí.</p>
      <input type="hidden" name={latName} value={lat ?? ""} />
      <input type="hidden" name={lngName} value={lng ?? ""} />
    </div>
  );
}
