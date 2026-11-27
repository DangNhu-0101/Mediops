import type { KhoangBan } from "./DuLieuNhung";
export interface NguoiDung {
  QuanTriDonVi: boolean;
  LaQuanTriHeThong: boolean;
  Quyen: string[];
  Id: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  SoDienThoai: string | null;
  AnhDaiDienUrl: string | null;
  GioiThieu: string | null;
  // Trình độ 1-5 theo chức danh đang giữ.
  TrinhDo: number | null;
  CacKhoangKhongKhaDung: KhoangBan[];
  NhomQuyenId: string | null;
  ChucDanhId: string | null;
  NhomQuyen: { Id: string; TenNhom: string } | null;
  ChucDanh: { Id: string; TenChucDanh: string } | null;
  DonViId: string | null;
  DonVi: {
    Id: string;
    MaDonVi: string;
    TenDonVi: string;
    DangHoatDong: boolean;
  } | null;
  NgayTao: string;
}

export interface DuLieuDangKy {
  HoTen: string;
  Email: string;
  TenDangNhap: string;
  SoDienThoai?: string;
  MatKhau: string;
}

export interface PhanHoiDangNhap {
  Token: string;
  NguoiDung: NguoiDung;
}
