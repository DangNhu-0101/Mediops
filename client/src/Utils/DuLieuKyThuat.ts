export interface CapDuLieuKyThuat {
  Khoa: string;
  GiaTri: string;
  GiaTriGoc?: unknown;
}

const NhanMacDinh: Record<string, string> = {
  trinhDo: "Trình độ",
  sucChua: "Sức chứa",
  vaiTro: "Chức danh",
  phongXanh: "Phông xanh",
  cachAm: "Cách âm",
  gianTreoDenTran: "Giàn treo đèn trần",
  dienTichM2: "Diện tích (m²)",
  thuongHieuOngKinhHoTro: "Hãng ống kính được hỗ trợ",
  modelOngKinhHoTro: "Mẫu ống kính được hỗ trợ",
  resolution: "Độ phân giải",
  iso: "Độ nhạy sáng ISO",
  mount: "Ngàm",
  power: "Nguồn điện",
  connection: "Kết nối",
  manufacturer: "Nhà sản xuất",
  model: "Kiểu máy",
  greenScreen: "Phông xanh",
  thuongHieu: "Nhà sản xuất",
  ngamOngKinh: "Ngàm ống kính",
  loaiCamBien: "Loại cảm biến",
  kichThuocCamBienMm: "Kích thước cảm biến (mm)",
  doPhanGiaiHieuDungMp: "Độ phân giải hiệu dụng (MP)",
  doPhanGiaiVideoToiDa: "Độ phân giải video tối đa",
  tocDoKhungHinh4KToiDaFps: "Tốc độ khung hình 4K tối đa (fps)",
  doSauBitToiDa: "Độ sâu màu tối đa (bit)",
  layMauMauToiDa: "Lấy mẫu màu tối đa",
  codecVideo: "Codec video",
  isoVideo: "ISO video",
  daiTuongPhanStop: "Dải tương phản (stop)",
  chongRungThanMay: "Chống rung thân máy",
  layNetTuDong: "Lấy nét tự động",
  theNho: "Phương tiện ghi",
  ketNoi: "Kết nối",
  kichThuocMm: "Kích thước (mm)",
  khoiLuongThanMayG: "Khối lượng thân máy (g)",
  dinhDangCamBien: "Định dạng cảm biến",
  tieuCuNhoNhatMm: "Tiêu cự nhỏ nhất (mm)",
  tieuCuLonNhatMm: "Tiêu cự lớn nhất (mm)",
  khauDoLonNhat: "Khẩu độ lớn nhất",
  khauDoNhoNhat: "Khẩu độ nhỏ nhất",
  chongRungQuangHoc: "Chống rung quang học",
  khoangLayNetGanNhatM: "Khoảng lấy nét gần nhất (m)",
  duongKinhKinhLocMm: "Đường kính kính lọc (mm)",
  khoiLuongG: "Khối lượng (g)",
  loaiPhuKien: "Loại phụ kiện",
  ngamNguon: "Ngàm nguồn",
  ngamDich: "Ngàm đích",
  truyenLayNetTuDong: "Truyền lấy nét tự động",
  truyenDuLieuExif: "Truyền dữ liệu EXIF",
  loaiDen: "Loại đèn",
  congSuatDauRaW: "Công suất đầu ra (W)",
  congSuatTieuThuToiDaW: "Công suất tiêu thụ tối đa (W)",
  doRoiLux: "Độ rọi",
  nhietDoMauK: "Nhiệt độ màu (K)",
  hoTroRgb: "Hỗ trợ RGB",
  cri: "CRI",
  tlci: "TLCI",
  daiDieuChinhPhanTram: "Dải điều chỉnh (%)",
  phuongThucDieuKhien: "Phương thức điều khiển",
  tuyChonNguon: "Tùy chọn nguồn",
  ngamPhuKien: "Ngàm phụ kiện",
  khoiLuongDauDenG: "Khối lượng đầu đèn (g)",
  loaiThietBiAmThanh: "Loại thiết bị âm thanh",
  huongThu: "Hướng thu",
  dapTuyenTanSoHz: "Đáp tuyến tần số (Hz)",
  doNhay: "Độ nhạy",
  ketNoiAmThanh: "Kết nối âm thanh",
  coDay: "Có dây",
  nguonPhantomV: "Nguồn phantom (V)",
  soKenhDauVao: "Số kênh đầu vào",
  tanSoLayMauKhz: "Tần số lấy mẫu (kHz)",
  doSauBit: "Độ sâu bit",
  dongBoTimecode: "Đồng bộ timecode",
  phuongTienGhi: "Phương tiện ghi",
};

const KhoaThongTinNguon = new Set([
  "nguonThamKhao",
  "nguonThamKhaoUrl",
  "source",
  "sourceUrl",
]);

const NhanGiaTriKyThuat: Record<string, string> = {
  SONY_E: "Sony E",
  CANON_EF: "Canon EF",
  CANON_RF: "Canon RF",
  FULL_FRAME: "Toàn khung hình",
  KHONG: "Không",
  "5_TRUC": "5 trục",
  "5_TRUC_5_5_STOP": "5 trục, hiệu quả 5,5 stop",
  CMOS_EXMOR_R_FULL_FRAME: "CMOS Exmor R toàn khung hình",
  DCI_4K_4096_X_2160: "DCI 4K (4096 × 2160)",
  UHD_4K_3840_X_2160: "UHD 4K (3840 × 2160)",
  XAVC_HS_H265: "XAVC HS (H.265)",
  XAVC_S_H264: "XAVC S (H.264)",
  XAVC_SI_H264: "XAVC S-I (H.264)",
  XAVC_I_H264: "XAVC-I (H.264)",
  XAVC_L_H264: "XAVC-L (H.264)",
  FAST_HYBRID_AF_627_DIEM_VIDEO: "Fast Hybrid AF, 627 điểm khi quay phim",
  FAST_HYBRID_AF_627_DIEM: "Fast Hybrid AF, 627 điểm",
  FAST_HYBRID_AF_759_DIEM: "Fast Hybrid AF, 759 điểm",
  XD_LINEAR_MOTOR: "Mô-tơ tuyến tính XD",
  NANO_USM: "Nano USM",
  HSM: "HSM",
  DDSSM: "DDSSM",
  CFEXPRESS_TYPE_A: "CFexpress Type A",
  SD_UHS_I_II: "Thẻ SD UHS-I/II",
  SD_SDHC_SDXC: "Thẻ SD/SDHC/SDXC",
  HDMI_TYPE_A: "HDMI Type-A",
  MICRO_HDMI: "Micro HDMI",
  USB_C: "USB-C",
  XLR_TRS_QUA_TAY_CAM: "XLR/TRS qua tay cầm",
  MIC_3_5_MM: "Mic 3,5 mm",
  WIFI: "Wi-Fi",
  BLUETOOTH: "Bluetooth",
  COB_LED_DIEM: "LED COB nguồn điểm",
  COB_LED_RGBWW: "LED COB RGBWW",
  TRUC_TIEP: "Điều khiển trực tiếp",
  SIDUS_LINK: "Sidus Link",
  ART_NET: "Art-Net",
  DMX512: "DMX512",
  CRMX: "CRMX",
  AC_100_240V: "Điện xoay chiều 100–240 V",
  DC_48V: "Điện một chiều 48 V",
  XLR_48V: "XLR 48 V",
  V_MOUNT: "Pin V-Mount",
  GOLD_MOUNT: "Pin Gold Mount",
  TRAM_PIN_V_GOLD_TUY_CHON: "Trạm pin V-Mount/Gold Mount tùy chọn",
  BOWENS: "Bowens",
  MICRO_SHOTGUN_CONDENSER_RF_BIAS: "Micro shotgun condenser RF-bias",
  MICRO_SHOTGUN_CONDENSER: "Micro shotgun condenser",
  SUPER_CARDIOID_SHOTGUN: "Supercardioid shotgun",
  SUPER_CARDIOID_LOBAR: "Supercardioid/lobar",
  XLR_3_PIN: "XLR 3 chân",
  MAY_GHI_AM_HIEN_TRUONG: "Máy ghi âm hiện trường",
  XLR_TRS_COMBO: "Cổng kết hợp XLR/TRS",
  LINE_OUT_3_5_MM: "Ngõ ra 3,5 mm",
  HEADPHONE_3_5_MM: "Tai nghe 3,5 mm",
  TCXO_0_2_PPM: "TCXO, độ chính xác 0,2 ppm",
  "32_BIT_FLOAT": "32-bit float",
  NGAM_CHUYEN_ONG_KINH: "Ngàm chuyển ống kính",
};

export const DanhSachTruongKyThuat = Object.entries(NhanMacDinh)
  .filter(([Khoa]) => !KhoaThongTinNguon.has(Khoa))
  .map(([Khoa, Nhan]) => ({ Khoa: Khoa, Nhan: Nhan }))
  .sort((A, B) => A.Nhan.localeCompare(B.Nhan, "vi"));

export function LaDuLieuKyThuatHienThi(Khoa: string, GiaTri: unknown) {
  const KhoaCuoi = Khoa.split(".").at(-1) ?? Khoa;
  if (KhoaThongTinNguon.has(KhoaCuoi)) return false;
  return !String(GiaTri ?? "")
    .toUpperCase()
    .includes("TODO_VERIFY");
}

export function LayNhanDuLieuKyThuat(Khoa: string) {
  const KhoaCuoi = Khoa.split(".").at(-1) ?? Khoa;
  if (NhanMacDinh[KhoaCuoi]) return NhanMacDinh[KhoaCuoi];
  return "Thông số bổ sung";
}

export function DinhDangGiaTriKyThuat(GiaTri: unknown): string {
  if (GiaTri === null || GiaTri === undefined || GiaTri === "") {
    return "Chưa cập nhật";
  }
  if (typeof GiaTri === "boolean") return GiaTri ? "Có" : "Không";
  if (Array.isArray(GiaTri)) {
    return GiaTri.map(DinhDangGiaTriKyThuat).join(", ");
  }
  if (typeof GiaTri === "object") {
    return Object.entries(GiaTri as Record<string, unknown>)
      .map(
        ([Khoa, GiaTriCon]) =>
          `${LayNhanDuLieuKyThuat(Khoa)}: ${DinhDangGiaTriKyThuat(GiaTriCon)}`,
      )
      .join("; ");
  }
  const GiaTriChuoi = String(GiaTri);
  return NhanGiaTriKyThuat[GiaTriChuoi] ?? GiaTriChuoi;
}

export function ChuyenThanhCapDuLieu(DuLieu: Record<string, unknown>) {
  const KetQua: CapDuLieuKyThuat[] = [];
  function Duyet(GiaTri: unknown, DuongDan: string) {
    if (
      typeof GiaTri === "object" &&
      GiaTri !== null &&
      !Array.isArray(GiaTri)
    ) {
      Object.entries(GiaTri as Record<string, unknown>).forEach(
        ([Khoa, GiaTriCon]) =>
          Duyet(GiaTriCon, DuongDan ? `${DuongDan}.${Khoa}` : Khoa),
      );
      return;
    }
    KetQua.push({
      Khoa: DuongDan,
      GiaTri: DinhDangGiaTriKyThuat(GiaTri),
      GiaTriGoc: GiaTri,
    });
  }
  Object.entries(DuLieu)
    .filter(([Khoa, GiaTri]) => LaDuLieuKyThuatHienThi(Khoa, GiaTri))
    .forEach(([Khoa, GiaTri]) => Duyet(GiaTri, Khoa));
  return KetQua;
}

export function ChuyenThanhDoiTuong(CacCap: CapDuLieuKyThuat[]) {
  const KetQua: Record<string, unknown> = {};
  CacCap.forEach(({ Khoa: Khoa, GiaTri: GiaTri, GiaTriGoc: GiaTriGoc }) => {
    if (!Khoa.trim()) return;
    const CacPhan = Khoa.trim().split(".");
    let DoiTuongHienTai = KetQua;
    CacPhan.forEach((Phan, ChiSo) => {
      if (ChiSo === CacPhan.length - 1) {
        const GiaTriDaChuanHoa = GiaTri.trim();
        DoiTuongHienTai[Phan] =
          GiaTriGoc !== undefined && GiaTri === DinhDangGiaTriKyThuat(GiaTriGoc)
            ? GiaTriGoc
            : GiaTriDaChuanHoa === "Có"
              ? true
              : GiaTriDaChuanHoa === "Không"
                ? false
                : /^-?\d+(\.\d+)?$/.test(GiaTriDaChuanHoa)
                  ? Number(GiaTriDaChuanHoa)
                  : GiaTriDaChuanHoa;
        return;
      }
      const GiaTriCon = DoiTuongHienTai[Phan];
      if (
        typeof GiaTriCon !== "object" ||
        GiaTriCon === null ||
        Array.isArray(GiaTriCon)
      ) {
        DoiTuongHienTai[Phan] = {};
      }
      DoiTuongHienTai = DoiTuongHienTai[Phan] as Record<string, unknown>;
    });
  });
  return KetQua;
}
