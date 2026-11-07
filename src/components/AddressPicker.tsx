"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, X } from "lucide-react";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface AddressResult {
  address: string;
  lat: number;
  lng: number;
}

const DEFAULT_CENTER: [number, number] = [21.0285, 105.8542];

interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward { code: number; name: string; }

// Hàm chuẩn hóa chuỗi để so khớp chính xác
const normalizeStr = (str?: string) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/(thành phố|tỉnh|quận|huyện|thị xã|thị trấn|phường|xã)\s+/g, "").trim();
};

function ClickableMarker({ position, onMove }: { position: [number, number]; onMove: (lat: number, lng: number) => void; }) {
  useMapEvents({ click(e) { onMove(e.latlng.lat, e.latlng.lng); } });
  return (
    <Marker
      position={position}
      draggable
      icon={markerIcon}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onMove(lat, lng);
        },
      }}
    />
  );
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [center, map]);
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface AddressPickerProps {
  onSelect: (result: AddressResult) => void;
  initialCenter?: [number, number];
  initialAddress?: string;
  disabled?: boolean;
}

function AddressPickerModal({ initialCenter, initialAddress, onConfirm, onClose }: any) {
  const [position, setPosition] = useState<[number, number]>(initialCenter ?? DEFAULT_CENTER);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [detail, setDetail] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const isManualInputRef = useRef(false);

  // 1. Fetch danh sách Tỉnh/Thành
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error(err));
  }, []);

  const fetchDistricts = async (provinceCode: number) => {
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts || []);
      return data.districts || [];
    } catch (e) { return []; }
  };

  const fetchWards = async (districtCode: number) => {
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await res.json();
      setWards(data.wards || []);
      return data.wards || [];
    } catch (e) { return []; }
  };

  // 2. KHÔI PHỤC STATE KHI MỞ LẠI MODAL (Xử lý lỗi bắt chọn lại từ đầu)
  useEffect(() => {
    if (initialAddress && provinces.length > 0 && !selectedProvince) {
      const parts = initialAddress.split(",").map((s: string) => s.trim());
      
      const provName = parts[parts.length - 1];
      const distName = parts[parts.length - 2];
      const wardName = parts[parts.length - 3];
      const detailName = parts.slice(0, Math.max(0, parts.length - 3)).join(", ");

      const matchedProv = provinces.find((p) => normalizeStr(p.name) === normalizeStr(provName));
      if (matchedProv) {
        setSelectedProvince(matchedProv);
        fetchDistricts(matchedProv.code).then((dists) => {
          const matchedDist = dists.find((d: any) => normalizeStr(d.name) === normalizeStr(distName));
          if (matchedDist) {
            setSelectedDistrict(matchedDist);
            fetchWards(matchedDist.code).then((wardsData) => {
              const matchedWard = wardsData.find((w: any) => normalizeStr(w.name) === normalizeStr(wardName));
              if (matchedWard) setSelectedWard(matchedWard);
            });
          }
        });
      }
      if (detailName && detail === "") setDetail(detailName);
    }
  }, [initialAddress, provinces]);

  // 3. Map -> Dropdown (Reverse Geocode)
  const resolveFromCoords = useCallback(async (lat: number, lng: number) => {
    setIsResolving(true);
    try {
      const res = await fetch(`/api/geocode/reverse-geocode?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data?.address || {};

      // OpenStreetMap trả về các trường khác nhau tùy khu vực
      const provStr = address.city || address.province || address.state;
      const distStr = address.city_district || address.county || address.district || address.town;
      const wardStr = address.suburb || address.village || address.quarter || address.hamlet;

      if (provStr && provinces.length > 0) {
        const matchedProv = provinces.find((p) => normalizeStr(p.name) === normalizeStr(provStr));
        
        if (matchedProv) {
          // Kiểm tra xem user có đang kéo Pin sang một Tỉnh khác hoàn toàn không
          const isProvChanged = !selectedProvince || matchedProv.code !== selectedProvince.code;
          
          setSelectedProvince(matchedProv);
          const loadedDistricts = await fetchDistricts(matchedProv.code);

          // Nếu Tỉnh bị thay đổi bởi Map Pin, ta bắt buộc phải reset Huyện/Xã
          if (isProvChanged) {
            setSelectedDistrict(null);
            setSelectedWard(null);
            setWards([]);
          }

          if (distStr) {
            const matchedDist = loadedDistricts.find((d: any) => normalizeStr(d.name) === normalizeStr(distStr));
            if (matchedDist) {
              const isDistChanged = !selectedDistrict || matchedDist.code !== selectedDistrict.code;
              setSelectedDistrict(matchedDist);
              const loadedWards = await fetchWards(matchedDist.code);

              if (isDistChanged) {
                 setSelectedWard(null);
              }

              if (wardStr) {
                const matchedWard = loadedWards.find((w: any) => normalizeStr(w.name) === normalizeStr(wardStr));
                if (matchedWard) {
                  setSelectedWard(matchedWard);
                }
                // BỎ LOGIC ELSE SET NULL Ở ĐÂY: Nếu không tìm thấy phường từ Map, giữ nguyên phường user đã chọn
              }
            }
            // BỎ LOGIC ELSE SET NULL Ở ĐÂY: Nếu không tìm thấy quận từ Map, giữ nguyên quận user đã chọn
          }
        }
      }

      // Cập nhật text chi tiết (Chỉ ghép những thành phần có tồn tại)
      const street = address.road || "";
      const houseNumber = address.house_number || "";
      const newDetail = [houseNumber, street].filter(Boolean).join(" ");
      
      // Không ghi đè nếu newDetail rỗng để tránh làm mất địa chỉ tay user vừa gõ
      if (newDetail) {
        setDetail(newDetail);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsResolving(false);
    }
  }, [provinces, selectedProvince, selectedDistrict]);

  const handleMove = useCallback((lat: number, lng: number) => {
    isManualInputRef.current = false; 
    setPosition([lat, lng]);
    resolveFromCoords(lat, lng);
  }, [resolveFromCoords]);

  // 4. Dropdown -> Map (Geocode)
  useEffect(() => {
    if (!isManualInputRef.current || !selectedProvince) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsResolving(true);
      const queryParts = [selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean);
      const searchQuery = queryParts.join(", ");

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
        const data = await res.json();
        
        if (controller.signal.aborted) return;

        if (data?.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else if (selectedWard) {
          const fallbackQuery = [selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(", ");
          const fallbackRes = await fetch(`/api/geocode?q=${encodeURIComponent(fallbackQuery)}`, { signal: controller.signal });
          const fallbackData = await fallbackRes.json();
          if (!controller.signal.aborted && fallbackData?.length > 0) {
             setPosition([parseFloat(fallbackData[0].lat), parseFloat(fallbackData[0].lon)]);
          }
        }
      } catch (error: any) {
        if (error.name !== "AbortError") console.error("Geocode error:", error);
      } finally {
        if (!controller.signal.aborted) setIsResolving(false);
      }
    }, 800);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [selectedProvince, selectedDistrict, selectedWard]);

  const handleConfirm = () => {
    const fullAddress = [detail, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]
      .filter(Boolean)
      .join(", ");
    onConfirm({ address: fullAddress, lat: position[0], lng: position[1] });
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-[#123832] text-lg">Thiết lập địa chỉ</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 p-6 overflow-y-auto flex-1">
          <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wider">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#123832] focus:border-[#E89B5A] focus:outline-none"
                value={selectedProvince?.code || ""}
                onChange={(e) => {
                  isManualInputRef.current = true;
                  const prov = provinces.find((p) => p.code === Number(e.target.value));
                  setSelectedProvince(prov || null);
                  setSelectedDistrict(null); setSelectedWard(null);
                  setDistricts([]); setWards([]);
                  if (prov) fetchDistricts(prov.code);
                }}
              >
                <option value="">Chọn Tỉnh / Thành phố</option>
                {provinces.map((p) => (<option key={p.code} value={p.code}>{p.name}</option>))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wider">Quận / Huyện <span className="text-red-500">*</span></label>
              <select
                disabled={!selectedProvince}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#123832] focus:border-[#E89B5A] focus:outline-none disabled:opacity-50"
                value={selectedDistrict?.code || ""}
                onChange={(e) => {
                  isManualInputRef.current = true;
                  const dist = districts.find((d) => d.code === Number(e.target.value));
                  setSelectedDistrict(dist || null); setSelectedWard(null);
                  setWards([]);
                  if (dist) fetchWards(dist.code);
                }}
              >
                <option value="">Chọn Quận / Huyện</option>
                {districts.map((d) => (<option key={d.code} value={d.code}>{d.name}</option>))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wider">Phường / Xã <span className="text-red-500">*</span></label>
              <select
                disabled={!selectedDistrict}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#123832] focus:border-[#E89B5A] focus:outline-none disabled:opacity-50"
                value={selectedWard?.code || ""}
                onChange={(e) => {
                  isManualInputRef.current = true;
                  const ward = wards.find((w) => w.code === Number(e.target.value));
                  setSelectedWard(ward || null);
                }}
              >
                <option value="">Chọn Phường / Xã</option>
                {wards.map((w) => (<option key={w.code} value={w.code}>{w.name}</option>))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wider">Địa chỉ chi tiết (Tùy chọn)</label>
              <input
                type="text"
                value={detail}
                onChange={(e) => {
                   isManualInputRef.current = false;
                   setDetail(e.target.value);
                }}
                placeholder="VD: Số 198, Phố ABC..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#123832] focus:border-[#E89B5A] focus:outline-none"
              />
            </div>

            {isResolving && <p className="text-xs text-[#E89B5A] animate-pulse font-medium">Đang tìm vị trí bản đồ...</p>}
          </div>

          <div className="flex-1 min-h-[320px] rounded-2xl overflow-hidden border-2 border-gray-200 relative">
            <MapContainer center={position} zoom={16} scrollWheelZoom style={{ height: "100%", width: "100%", minHeight: 320 }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController center={position} />
              <ClickableMarker position={position} onMove={handleMove} />
            </MapContainer>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">Hủy</button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedProvince || !selectedDistrict || !selectedWard}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#E89B5A] text-white hover:bg-[#D68B4E] disabled:opacity-50"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressPickerInner({ onSelect, initialCenter, initialAddress = "", disabled = false }: AddressPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayAddress, setDisplayAddress] = useState(initialAddress);
  const [lastResult, setLastResult] = useState<AddressResult | null>(null);

  useEffect(() => {
    setDisplayAddress(initialAddress);
  }, [initialAddress]);

  const handleConfirm = (result: AddressResult) => {
    setDisplayAddress(result.address);
    setLastResult(result);
    onSelect(result);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left text-[#123832] hover:bg-white focus:border-[#E89B5A] transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
      >
        <MapPin size={18} className="text-gray-400 group-hover:text-[#E89B5A] transition-colors shrink-0" />
        <span className={displayAddress ? "text-[#123832] font-medium line-clamp-1" : "text-gray-400"}>
          {displayAddress || "Bấm để thiết lập địa chỉ"}
        </span>
      </button>
      {isOpen && (
        <AddressPickerModal
          initialCenter={lastResult ? [lastResult.lat, lastResult.lng] : initialCenter}
          initialAddress={displayAddress}
          onConfirm={handleConfirm}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
export default AddressPickerInner;
