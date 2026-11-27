import type { TrangThaiThietBi } from "./ThietBi";

export type MucDoSuCo = "NHE" | "TRUNG_BINH" | "NGHIEM_TRONG";
export type TrangThaiSuCo = "CHO_XU_LY" | "DANG_SUA_CHUA" | "DA_KHAC_PHUC";
export type NguonSuCo = "NHAP_KHO" | "TRONG_QUA_TRINH_SU_DUNG" | "KIEM_TRA_KHO";

export interface NguoiLienQuanSuCo {
  Id: string;
  HoTen: string;
  ChucDanh: { TenChucDanh: string } | null;
}

export interface SuCoBaoTri {
  Id: string;
  ThietBiId: string;
  CaQuayId: string | null;
  KhoId: string | null;
  Nguon: NguonSuCo;
  MucDo: MucDoSuCo;
  MoTaLoi: string;
  TrangThai: TrangThaiSuCo;
  NgayTao: string;
  NgayBatDauXuLy: string | null;
  NgayHoanTat: string | null;
  PhuongAnXuLy: string | null;
  TrangThaiThietBiSauXuLy: TrangThaiThietBi | null;
  ThietBi: {
    Id: string;
    MaQR: string;
    SoSeri: string;
    TenThietBi: string;
    TrangThai: TrangThaiThietBi;
    HinhAnhUrl: string | null;
    Kho: { Id: string; MaKho: string; TenKho: string } | null;
  };
  CaQuay: {
    Id: string;
    MaCaQuay: string | null;
    TieuDe: string;
    ThoiGianBatDau: string;
    ThoiGianKetThuc: string;
  } | null;
  Kho: {
    Id: string;
    MaKho: string;
    TenKho: string;
    DiaChi: string;
  } | null;
  NguoiBaoCao: NguoiLienQuanSuCo;
  NguoiBatDauXuLy: NguoiLienQuanSuCo | null;
  NguoiHoanTat: NguoiLienQuanSuCo | null;
  DanhSachAnh: Array<{ Id: string; SecureUrl: string; NgayTao: string }>;
  NhatKyXuLy: Array<{
    Id: string;
    GhiChu: string;
    TrangThaiThietBi: TrangThaiThietBi;
    NgayTao: string;
    NguoiThucHien: NguoiLienQuanSuCo;
  }>;
}

export interface DuLieuBaoSuCo {
  ThietBiId: string;
  CaQuayId?: string;
  KhoId?: string;
  MucDo: MucDoSuCo;
  MoTaLoi: string;
  Nguon: Exclude<NguonSuCo, "NHAP_KHO">;
}
