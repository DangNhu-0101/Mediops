export interface KetQuaTimDiaChi {
  ViDo: number;
  KinhDo: number;
  TenDayDu: string;
}

interface PhanHoiNominatim {
  lat: string;
  lon: string;
  display_name: string;
}

const DuongDanNominatim = "https://nominatim.openstreetmap.org/search";

// Tra tọa độ từ địa chỉ qua Nominatim (OpenStreetMap), không cần khóa API.
// Chính sách Nominatim giới hạn khoảng 1 yêu cầu mỗi giây, nên chỉ gọi khi
// người dùng chủ động bấm tìm.
export async function TimToaDoTheoDiaChi(
  DiaChi: string,
): Promise<KetQuaTimDiaChi | null> {
  const ThamSo = new URLSearchParams({
    q: DiaChi,
    format: "jsonv2",
    limit: "1",
    countrycodes: "vn",
    "accept-language": "vi",
  });
  let PhanHoi: Response;
  try {
    PhanHoi = await fetch(`${DuongDanNominatim}?${ThamSo}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error(
      "Không kết nối được dịch vụ tìm địa chỉ. Hãy kiểm tra mạng rồi thử lại.",
    );
  }
  if (!PhanHoi.ok) {
    throw new Error(
      "Dịch vụ tìm địa chỉ đang bận. Hãy đợi vài giây rồi thử lại.",
    );
  }
  const DanhSach = (await PhanHoi.json()) as PhanHoiNominatim[];
  const DauTien = DanhSach[0];
  if (!DauTien) return null;
  const ViDo = Number(DauTien.lat);
  const KinhDo = Number(DauTien.lon);
  if (!Number.isFinite(ViDo) || !Number.isFinite(KinhDo)) return null;
  return {
    ViDo,
    KinhDo,
    TenDayDu: DauTien.display_name,
  };
}
