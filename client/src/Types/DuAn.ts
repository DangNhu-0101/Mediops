export type TrangThaiDuAn =
  "DANG_CHUAN_BI" | "DANG_SAN_XUAT" | "HOAN_THANH" | "DA_HUY";

export interface DuAn {
  Id: string;
  MaDuAn: string | null;
  TenDuAn: string;
  TenKhachHang: string | null;
  MoTa: string | null;
  TrangThai: TrangThaiDuAn;
  NgayTao: string;
  HanChot: string | null;
  _count: { DanhSachCa: number };
}

export interface DuLieuDuAn {
  MaDuAn?: string;
  TenDuAn: string;
  TenKhachHang?: string;
  MoTa?: string;
  TrangThai: TrangThaiDuAn;
  HanChot?: string;
}
