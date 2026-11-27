export interface KhoangBan {
  Id: string;
  BatDau: string;
  KetThuc: string;
  LyDo: string | null;
}
export interface YeuCauTaiNguyen {
  Id: string;
  MaYeuCau: string;
  LoaiTaiNguyen: "THIET_BI" | "NHAN_SU" | "STUDIO";
  SoLuong: number;
  BatBuoc: boolean;
  ChoPhepThayThe: boolean;
  TrongSo: number;
  DanhMucThietBiId: string | null;
  ThietBiUuTienId: string | null;
  ChucDanhId: string | null;
  ThongSoToiThieu: Record<string, unknown> | null;
  ThongSoUuTien: Record<string, unknown> | null;
}
export interface YeuCauHienThi extends YeuCauTaiNguyen {
  TenDanhMuc: string | null;
  TenThietBiUuTien: string | null;
  TenChucDanh: string | null;
}
