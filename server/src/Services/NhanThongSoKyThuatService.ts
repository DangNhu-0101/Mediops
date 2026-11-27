// Nhãn tiếng Việt của các trường thông số kỹ thuật, đồng bộ với
// client/src/Utils/DuLieuKyThuat.ts để người dùng nhập theo nhãn đang hiển thị.
export const NhanTruongThongSo: Record<string, string> = {
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

// Trường của hồ sơ khác hoặc khóa cũ trùng nhãn; khi nhập luôn dùng khóa chuẩn hiện tại.
const TruongKhongNhap = new Set([
  "trinhDo",
  "sucChua",
  "vaiTro",
  "phongXanh",
  "cachAm",
  "gianTreoDenTran",
  "dienTichM2",
  "resolution",
  "iso",
  "mount",
  "power",
  "connection",
  "manufacturer",
  "greenScreen",
  "phuongTienGhi",
]);

// Tên gọi quen thuộc khác của cùng trường.
const NhanBoSung: Record<string, string> = {
  "thương hiệu": "thuongHieu",
  hãng: "thuongHieu",
  model: "model",
};

function ChuanHoaNhan(GiaTri: string) {
  return GiaTri.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
}

// Tra khóa lưu trữ từ nhãn; chấp nhận nhãn có hoặc không kèm đơn vị trong ngoặc.
export function TimKhoaThongSo(Nhan: string): string | undefined {
  const CanTim = ChuanHoaNhan(Nhan);
  if (NhanBoSung[CanTim]) return NhanBoSung[CanTim];
  for (const [Khoa, NhanHienThi] of Object.entries(NhanTruongThongSo)) {
    if (TruongKhongNhap.has(Khoa)) continue;
    const NhanChuan = ChuanHoaNhan(NhanHienThi);
    if (NhanChuan === CanTim || NhanChuan.replace(/\s*\(.*\)$/, "") === CanTim)
      return Khoa;
  }
  return undefined;
}
