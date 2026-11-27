export type TrangThaiStudio = "SAN_SANG" | "BAO_TRI" | "DONG_CUA";

export interface PhongStudio {
  Id: string;
  MaPhong: string | null;
  TenPhong: string;
  DiaDiem: string | null;
  SucChua: number | null;
  KhaNang: Record<string, unknown> | null;
  TrangThai: TrangThaiStudio;
  _count: { DanhSachCa: number };
}

export interface DuLieuPhongStudio {
  MaPhong?: string;
  TenPhong: string;
  DiaDiem?: string;
  SucChua?: number;
  KhaNang?: Record<string, unknown>;
  TrangThai: TrangThaiStudio;
}
