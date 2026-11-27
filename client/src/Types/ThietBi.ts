export type TrangThaiThietBi =
  "SAN_SANG" | "DANG_SU_DUNG" | "BAO_TRI" | "HU_HONG";

// Bản ghi gọn dùng để chọn thiết bị khi phân công hoặc khai báo yêu cầu.
export interface ThietBiLuaChon {
  Id: string;
  MaQR: string;
  TenThietBi: string;
  DanhMucId: string;
  TrangThai: TrangThaiThietBi;
  ThongSoKyThuat: Record<string, unknown>;
  DanhMuc: { Id: string; TenDanhMuc: string };
}

export interface DanhMucThietBi {
  Id: string;
  MaDanhMuc: string | null;
  TenDanhMuc: string;
}

export interface Kho {
  Id: string;
  MaKho: string;
  TenKho: string;
  DiaChi: string;
  BanKinhXacMinhMet: number;
}

export interface ThietBi {
  ViTriThucTe?: "TAI_KHO" | "NGOAI_KHO" | "CHUA_XAC_MINH";
  MauThietBiId?: string | null;
  MauThietBi?: {
    Id: string;
    MaMau: string;
    TenMau: string;
    DanhMucId: string;
  } | null;
  TrangThaiHienThi?: import("./ThongKeVanHanh").TrangThaiHienThi | null;
  CanhBao?: string[];
  HienCo?: boolean;
  ChanCapPhat?: boolean;
  Id: string;
  MaQR: string;
  SoSeri: string;
  TenThietBi: string;
  DanhMucId: string;
  ThongSoKyThuat: Record<string, unknown>;
  TrangThai: TrangThaiThietBi;
  HinhAnhUrl: string | null;
  NguonThamKhaoUrl: string | null;
  ViTriKho: string | null;
  KhoId: string | null;
  ThoiGianKiemTraSauSuDungPhut: number;
  DanhMuc: DanhMucThietBi;
  Kho: (Kho & { DangHoatDong: boolean }) | null;
}

export interface DuLieuThietBi {
  MauThietBiId?: string;
  MaQR?: string;
  SoSeri: string;
  TenThietBi: string;
  DanhMucId: string;
  ThongSoKyThuat: string;
  TrangThai: TrangThaiThietBi;
  HinhAnhUrl?: string;
  ViTriKho?: string;
  KhoId?: string;
  ThoiGianKiemTraSauSuDungPhut?: string;
}
