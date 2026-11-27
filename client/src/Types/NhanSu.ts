export interface NhanSu {
  Id: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  SoDienThoai: string | null;
  NhomQuyenId: string | null;
  ChucDanhId: string | null;
  NhomQuyen: { Id: string; TenNhom: string } | null;
  ChucDanh: { Id: string; TenChucDanh: string } | null;
  QuanTriDonVi?: boolean;
  NgayTao: string;
  _count: { CaQuayPhuTrach: number; CaQuayThamGia: number };
}
export interface DuLieuNhanSu {
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  SoDienThoai?: string;
  NhomQuyenId: string;
  ChucDanhId: string;
  QuanTriDonVi?: boolean;
  MatKhau?: string;
}
