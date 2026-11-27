export type BangQuyen = Record<
  string,
  { Ten: string; ThaoTac: Record<string, string> }
>;

export interface NhomQuyen {
  Id: string;
  TenNhom: string;
  MoTa: string | null;
  LaMau: boolean;
  SoThanhVien: number;
  // Chỉ quản trị đơn vị nhận cấu hình quyền và bộ quyền mẫu.
  Quyen?: string[];
  QuyenMau?: string[] | null;
}

export interface DanhSachNhomQuyen {
  BangQuyen: BangQuyen | null;
  DanhSach: NhomQuyen[];
}

export interface DuLieuNhomQuyen {
  TenNhom: string;
  MoTa: string | null;
  Quyen: string[];
}

export interface ChucDanh {
  Id: string;
  TenChucDanh: string;
  DangSuDung: boolean;
  // Chức danh dùng chung do quản trị hệ thống quản lý; đơn vị chỉ xem.
  LaDungChung: boolean;
  SoNguoiDung: number;
  SoLanPhanCong: number;
}
