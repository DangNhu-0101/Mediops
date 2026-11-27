export interface QuanLyChinh {
  Id: string;
  HoTen: string;
  Email: string;
  TenDangNhap: string;
}

export interface DonVi {
  Id: string;
  MaDonVi: string;
  TenDonVi: string;
  Email: string | null;
  SoDienThoai: string | null;
  DiaChi: string | null;
  DangHoatDong: boolean;
  NgayTao: string;
  DanhSachNguoiDung: QuanLyChinh[];
  _count: { DanhSachNguoiDung: number };
}

export interface DuLieuDonVi {
  MaDonVi: string;
  TenDonVi: string;
  Email?: string;
  SoDienThoai?: string;
  DiaChi?: string;
  DangHoatDong?: boolean;
}

export interface DuLieuTaoDonVi {
  DonVi: Omit<DuLieuDonVi, "DangHoatDong">;
  QuanLy: {
    TenDangNhap: string;
    MatKhau: string;
    HoTen: string;
    Email: string;
    SoDienThoai?: string;
  };
}
