export interface ThietBiKyThuat {
  Id: string;
  TenThietBi: string;
  ThongSoKyThuat: unknown;
}
function DoiTuong(GiaTri: unknown): Record<string, unknown> {
  return typeof GiaTri === "object" && GiaTri !== null && !Array.isArray(GiaTri)
    ? (GiaTri as Record<string, unknown>)
    : {};
}
function ChuanHoa(GiaTri: unknown): string {
  return typeof GiaTri === "string"
    ? GiaTri.trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_")
    : "";
}
function CacGiaTri(GiaTri: unknown): string[] {
  return (Array.isArray(GiaTri) ? GiaTri : [GiaTri])
    .map(ChuanHoa)
    .filter(Boolean);
}

// Tính từ thuộc tính kỹ thuật tại thời điểm yêu cầu, không tra cặp thiết bị khai báo sẵn.
export function KiemTraTuongThichThietBi(
  UngVien: ThietBiKyThuat,
  Goc: ThietBiKyThuat,
  GiuLai: ThietBiKyThuat[],
  BoChuyenKhaDung: ThietBiKyThuat[],
) {
  const ThongSo = DoiTuong(UngVien.ThongSoKyThuat);
  const ThongSoGoc = DoiTuong(Goc.ThongSoKyThuat);
  const DienGiai: string[] = [];
  const ThietBiTrungGian: Array<{ Id: string; TenThietBi: string }> = [];
  for (const Khoa of ["ngamOngKinh", "ngamPhuKien", "ketNoiAmThanh"]) {
    if (CacGiaTri(ThongSoGoc[Khoa]).length && !CacGiaTri(ThongSo[Khoa]).length)
      return {
        HopLe: false,
        DienGiai: ["Chưa đủ thông số kết nối để xác nhận khả năng thay thế."],
        ThietBiTrungGian,
      };
  }
  const LaOngKinh = (Muc: Record<string, unknown>) =>
    "tieuCuNhoNhatMm" in Muc || "khauDoLonNhat" in Muc;
  const LaMayQuay = (Muc: Record<string, unknown>) =>
    "loaiCamBien" in Muc || "doPhanGiaiVideoToiDa" in Muc;
  if (
    LaOngKinh(ThongSoGoc) !== LaOngKinh(ThongSo) ||
    LaMayQuay(ThongSoGoc) !== LaMayQuay(ThongSo)
  )
    return {
      HopLe: false,
      DienGiai: ["Không cùng chức năng kỹ thuật với thiết bị cần thay."],
      ThietBiTrungGian,
    };
  for (const ConLai of GiuLai) {
    const ThuocTinh = DoiTuong(ConLai.ThongSoKyThuat);
    const CapMayOng =
      (LaOngKinh(ThongSo) && LaMayQuay(ThuocTinh)) ||
      (LaMayQuay(ThongSo) && LaOngKinh(ThuocTinh));
    if (CapMayOng) {
      const OngKinh = LaOngKinh(ThongSo) ? ThongSo : ThuocTinh;
      const MayQuay = LaMayQuay(ThongSo) ? ThongSo : ThuocTinh;
      const NgamOng = ChuanHoa(OngKinh.ngamOngKinh),
        NgamMay = ChuanHoa(MayQuay.ngamOngKinh);
      if (!NgamOng || !NgamMay)
        return {
          HopLe: false,
          DienGiai: ["Chưa đủ dữ liệu ngàm máy và ống kính."],
          ThietBiTrungGian,
        };
      if (NgamOng !== NgamMay) {
        const BoChuyen = BoChuyenKhaDung.find((Muc) => {
          const T = DoiTuong(Muc.ThongSoKyThuat);
          // Ngoài chiều chuyển ngàm phải có phạm vi hỗ trợ được nhập rõ; không suy đoán mọi ống kính cùng ngàm đều dùng được.
          const HoTro =
            CacGiaTri(T.modelOngKinhHoTro).includes(ChuanHoa(OngKinh.model)) ||
            CacGiaTri(T.thuongHieuOngKinhHoTro).includes(
              ChuanHoa(OngKinh.thuongHieu),
            );
          return (
            ChuanHoa(T.ngamNguon) === NgamOng &&
            ChuanHoa(T.ngamDich) === NgamMay &&
            HoTro
          );
        });
        if (!BoChuyen)
          return {
            HopLe: false,
            DienGiai: [
              "Khác ngàm và chưa có bộ chuyển đổi khả dụng được xác nhận hỗ trợ.",
            ],
            ThietBiTrungGian,
          };
        if (!ThietBiTrungGian.some((Muc) => Muc.Id === BoChuyen.Id))
          ThietBiTrungGian.push({
            Id: BoChuyen.Id,
            TenThietBi: BoChuyen.TenThietBi,
          });
        DienGiai.push(`Cần bộ chuyển đổi ${BoChuyen.TenThietBi}.`);
      } else DienGiai.push("Máy quay và ống kính cùng ngàm.");
      const VungPhu = ChuanHoa(OngKinh.dinhDangCamBien),
        CamBien = ChuanHoa(MayQuay.loaiCamBien);
      if (CamBien.includes("FULL_FRAME") && !VungPhu)
        return {
          HopLe: false,
          DienGiai: ["Chưa đủ dữ liệu vùng phủ của ống kính."],
          ThietBiTrungGian,
        };
      if (
        CamBien.includes("FULL_FRAME") &&
        VungPhu &&
        !VungPhu.includes("FULL_FRAME")
      )
        return {
          HopLe: false,
          DienGiai: ["Ống kính không phủ định dạng cảm biến đã chọn."],
          ThietBiTrungGian,
        };
    }
  }
  // Chuẩn kết nối âm thanh của thiết bị thay phải giữ được các chuẩn mà thiết bị gốc cung cấp.
  const KetNoiGoc = CacGiaTri(ThongSoGoc.ketNoiAmThanh);
  if (
    KetNoiGoc.length &&
    !KetNoiGoc.every((Khoa) => CacGiaTri(ThongSo.ketNoiAmThanh).includes(Khoa))
  )
    return {
      HopLe: false,
      DienGiai: ["Không đáp ứng chuẩn kết nối âm thanh của thiết bị gốc."],
      ThietBiTrungGian,
    };
  return { HopLe: true, DienGiai, ThietBiTrungGian };
}
