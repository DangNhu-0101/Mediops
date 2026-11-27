const MuiGioVietNamMs = 7 * 60 * 60 * 1000;

export function TaoKhoangNgayVietNam(Ngay: string) {
  const [ChuoiNam, ChuoiThang, ChuoiNgay] = Ngay.split("-");
  const Nam = Number(ChuoiNam ?? NaN);
  const Thang = Number(ChuoiThang ?? NaN);
  const NgayTrongThang = Number(ChuoiNgay ?? NaN);
  const NgayUtc = new Date(Date.UTC(Nam, Thang - 1, NgayTrongThang));

  if (
    NgayUtc.getUTCFullYear() !== Nam ||
    NgayUtc.getUTCMonth() !== Thang - 1 ||
    NgayUtc.getUTCDate() !== NgayTrongThang
  ) {
    throw new Error("Ngày không hợp lệ");
  }

  const TuNgay = new Date(NgayUtc.getTime() - MuiGioVietNamMs);
  const DenNgay = new Date(TuNgay.getTime() + 24 * 60 * 60 * 1000);
  return { TuNgay: TuNgay, DenNgay: DenNgay };
}

export function LayNgayHienTaiVietNam(ThoiDiem = new Date()) {
  return new Date(ThoiDiem.getTime() + MuiGioVietNamMs)
    .toISOString()
    .slice(0, 10);
}
