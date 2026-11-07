"use client";
// Bản đồ Leaflet (OpenStreetMap). Click để đặt vị trí. Chỉ load ở client.
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({
  lat,
  lng,
  onPick,
  height = 280,
}: {
  lat: number | null;
  lng: number | null;
  onPick?: (lat: number, lng: number) => void;
  height?: number;
}) {
  const hasPoint = lat !== null && lng !== null;
  const center: [number, number] = hasPoint ? [lat as number, lng as number] : [16.0, 106.5];
  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-gray-200">
      <MapContainer center={center} zoom={hasPoint ? 16 : 5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPoint && <CircleMarker center={center} radius={9} pathOptions={{ color: "#1d150b", fillColor: "#c49b63", fillOpacity: 1 }} />}
        {onPick && <ClickHandler onPick={onPick} />}
      </MapContainer>
    </div>
  );
}
