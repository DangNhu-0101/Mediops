import { useEffect, useState } from "react";
import { divIcon, latLng } from "leaflet";
import type {
  LeafletEventHandlerFnMap,
  Marker as MarkerLeaflet,
} from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TimToaDoTheoDiaChi } from "../Services/TimDiaChiService";

interface ThuocTinhBanDoKho {
  ViDo?: number;
  KinhDo?: number;
  BanKinhMet: number;
  DiaChiGoiY?: string;
  OnChon: (ViDo: number, KinhDo: number) => void;
}

const TamMacDinh: [number, number] = [10.776889, 106.700806];
const MauDiem = "#C4462B";

// Ghim vẽ bằng HTML để không phụ thuộc ảnh biểu tượng mặc định của Leaflet.
const BieuTuongGhim = divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:${MauDiem};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);transform:rotate(-45deg)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

interface ThuocTinhLangNghe {
  OnChon: (ViDo: number, KinhDo: number) => void;
}

// Lắng nghe thao tác chạm để chọn tâm kho.
function LangNgheChon({ OnChon }: ThuocTinhLangNghe) {
  useMapEvents({
    click(SuKien) {
      OnChon(SuKien.latlng.lat, SuKien.latlng.lng);
    },
  });
  return null;
}

interface ThuocTinhCanhBanDo {
  ViDo: number;
  KinhDo: number;
  BanKinhMet: number;
}

// Bay bản đồ tới vùng xác nhận mỗi khi tâm hoặc bán kính thay đổi.
function CanhBanDo({ ViDo, KinhDo, BanKinhMet }: ThuocTinhCanhBanDo) {
  const BanDo = useMap();
  useEffect(() => {
    const Tam = latLng(ViDo, KinhDo);
    BanDo.invalidateSize();
    if (Number.isFinite(BanKinhMet) && BanKinhMet > 0) {
      // Khung vuông bao quanh vòng tròn; không dùng Circle.getBounds vì nó cần vòng đã nằm trên bản đồ.
      const GioiHan = Tam.toBounds(BanKinhMet * 2);
      BanDo.flyToBounds(GioiHan, { padding: [32, 32], duration: 0.8 });
    } else {
      BanDo.flyTo(Tam, Math.max(BanDo.getZoom(), 17), { duration: 0.8 });
    }
  }, [BanDo, ViDo, KinhDo, BanKinhMet]);
  return null;
}

export function BanDoKho({
  ViDo,
  KinhDo,
  BanKinhMet,
  DiaChiGoiY,
  OnChon,
}: ThuocTinhBanDoKho) {
  // null nghĩa là ô tìm kiếm đang theo địa chỉ kho trong biểu mẫu.
  const [TuKhoa, SetTuKhoa] = useState<string | null>(null);
  const [DangTim, SetDangTim] = useState(false);
  const [ThongBao, SetThongBao] = useState("");
  const [CoLoi, SetCoLoi] = useState(false);
  const GiaTriTimKiem = TuKhoa ?? DiaChiGoiY ?? "";

  const CoToaDo =
    Number.isFinite(ViDo) &&
    Number.isFinite(KinhDo) &&
    Math.abs(ViDo!) <= 90 &&
    Math.abs(KinhDo!) <= 180;
  const Tam: [number, number] = CoToaDo ? [ViDo!, KinhDo!] : TamMacDinh;
  const CoBanKinh = Number.isFinite(BanKinhMet) && BanKinhMet > 0;

  const SuKienGhim: LeafletEventHandlerFnMap = {
    dragend(SuKien) {
      const ViTri = (SuKien.target as MarkerLeaflet).getLatLng();
      OnChon(ViTri.lat, ViTri.lng);
      SetCoLoi(false);
      SetThongBao("Đã cập nhật tọa độ theo vị trí ghim mới.");
    },
  };

  async function TimVaGhim() {
    const DiaChi = GiaTriTimKiem.trim();
    if (!DiaChi) {
      SetCoLoi(true);
      SetThongBao("Hãy nhập địa chỉ cần tìm.");
      return;
    }
    SetDangTim(true);
    SetThongBao("");
    try {
      const KetQua = await TimToaDoTheoDiaChi(DiaChi);
      if (!KetQua) {
        SetCoLoi(true);
        SetThongBao(
          "Không tìm thấy địa chỉ này. Hãy thử ghi rõ tên đường, phường, quận hoặc chạm trực tiếp lên bản đồ.",
        );
        return;
      }
      OnChon(KetQua.ViDo, KetQua.KinhDo);
      SetCoLoi(false);
      SetThongBao(
        `Đã ghim: ${KetQua.TenDayDu}. Nếu lệch vị trí, hãy kéo ghim tới đúng cửa kho.`,
      );
    } catch (Loi: unknown) {
      SetCoLoi(true);
      SetThongBao(
        Loi instanceof Error
          ? Loi.message
          : "Không tìm được địa chỉ. Hãy thử lại.",
      );
    } finally {
      SetDangTim(false);
    }
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Địa chỉ cần tìm trên bản đồ"
          className="h-11 w-full rounded border border-rail bg-case px-3"
          placeholder="Ví dụ: 12 Nguyễn Huệ, Bến Nghé, Quận 1"
          value={GiaTriTimKiem}
          onChange={(SuKien) => SetTuKhoa(SuKien.target.value)}
          onKeyDown={(SuKien) => {
            if (SuKien.key !== "Enter") return;
            // Chặn Enter gửi cả biểu mẫu kho.
            SuKien.preventDefault();
            if (!DangTim) void TimVaGhim();
          }}
        />
        <button
          className="min-h-11 shrink-0 rounded border border-rail px-4 disabled:opacity-60"
          type="button"
          disabled={DangTim}
          onClick={() => void TimVaGhim()}
        >
          {DangTim ? "Đang tìm…" : "Tìm & Ghim"}
        </button>
      </div>
      <p className="mb-2 text-sm text-fog">
        Tìm theo địa chỉ, chạm vào bản đồ hoặc kéo ghim để chọn tâm kho. Vòng
        tròn là phạm vi nhân sự phải đứng trong khi quét QR.
      </p>
      {ThongBao ? (
        <p
          role="status"
          className={
            CoLoi
              ? "mb-2 rounded border border-timecode p-2 text-sm"
              : "mb-2 text-sm text-fog"
          }
        >
          {ThongBao}
        </p>
      ) : null}
      <MapContainer
        aria-label="Bản đồ chọn vị trí kho"
        center={Tam}
        zoom={CoToaDo ? 17 : 12}
        scrollWheelZoom={false}
        className="z-0 h-72 w-full rounded border border-rail"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LangNgheChon OnChon={OnChon} />
        {CoToaDo ? (
          <>
            <CanhBanDo ViDo={Tam[0]} KinhDo={Tam[1]} BanKinhMet={BanKinhMet} />
            {CoBanKinh ? (
              <Circle
                center={Tam}
                radius={BanKinhMet}
                pathOptions={{
                  color: MauDiem,
                  weight: 2,
                  fillColor: MauDiem,
                  fillOpacity: 0.12,
                }}
                interactive={false}
              />
            ) : null}
            <Marker
              position={Tam}
              icon={BieuTuongGhim}
              draggable
              eventHandlers={SuKienGhim}
              title="Kéo để chỉnh vị trí kho"
            />
          </>
        ) : null}
      </MapContainer>
      {CoToaDo ? (
        <p className="mt-2 text-sm text-fog">
          Tọa độ kho: {Tam[0].toFixed(6)}, {Tam[1].toFixed(6)}
          {CoBanKinh ? ` · Bán kính xác nhận ${BanKinhMet} m` : ""}
        </p>
      ) : (
        <p className="mt-2 text-sm text-fog">
          Chưa chọn điểm kho. Hãy nhập địa chỉ rồi bấm Tìm &amp; Ghim.
        </p>
      )}
    </div>
  );
}
