export interface KhoQuanLy {
  Id: string;
  MaKho: string;
  TenKho: string;
  DiaChi: string;
  ViDo: number;
  KinhDo: number;
  BanKinhXacMinhMet: number;
  DangHoatDong: boolean;
  NgayCapNhat: string;
  _count: { DanhSachThietBi: number | null; DanhSachGiaoDich: number | null };
}

export interface DuLieuKho {
  MaKho: string;
  TenKho: string;
  DiaChi: string;
  ViDo: number;
  KinhDo: number;
  BanKinhXacMinhMet: number;
  DangHoatDong: boolean;
}

export interface KhoThongKe extends Omit<KhoQuanLy, "_count"> {
  TongKho: import("./ThongKeVanHanh").TongKho | null;
  GiaoDich: Array<{
    Id: string;
    LoaiHanhDong: string;
    ThoiGian: string;
    CaQuay: { Id: string; TieuDe: string };
    _count: { DanhSachNhatKy: number };
  }>;
  TongGiaoDich: number | null;
  SuCo: Array<{
    Id: string;
    MoTaLoi: string;
    TrangThai: string;
    NgayTao: string;
    ThietBi: { Id: string; TenThietBi: string; MaQR: string };
  }>;
  TongSuCo: number | null;
  CacCa: Array<{
    Id: string;
    TieuDe: string;
    ThoiGianBatDau: string;
    DuAn: { Id: string; TenDuAn: string };
  }>;
  TongCa: number;
  Trang: number;
  KichThuoc: number;
}
