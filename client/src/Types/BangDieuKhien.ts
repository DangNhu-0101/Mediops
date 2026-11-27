import type { TrangThaiCaQuay } from "./CaQuay";
import type { MucDoSuCo, TrangThaiSuCo } from "./SuCoBaoTri";

export interface DuLieuBangDieuKhien {
  Ngay: string;
  TongCaQuayHomNay: number;
  TongXungDot: number;
  CoTheXemXungDot: boolean;
  CoTheXemSuCo: boolean;
  CoTheXemNhatKy: boolean;
  ThongKeThietBi: {
    TongSo: number;
    Ranh: number;
    ChoSuDung: number;
    DangSuDung: number;
    BaoTri: number;
    NgoaiLe: number;
  } | null;
  DanhSachCaQuay: Array<{
    Id: string;
    TieuDe: string;
    ThoiGianBatDau: string;
    ThoiGianKetThuc: string;
    TrangThai: TrangThaiCaQuay;
    DuAn: string;
    Studio: string;
    NguoiPhuTrach: string;
    SoThietBi: number;
    SoThietBiChoXuat: number;
    CoXungDot: boolean;
  }>;
  ConCaQuayKhac: number;
  CanXuLy: Array<{
    Loai: "XUNG_DOT" | "SU_CO" | "KHO";
    Id: string;
    TieuDe: string;
    MoTa: string;
    DuongDan: string;
  }>;
  DanhSachSuCo: Array<{
    Id: string;
    MucDo: MucDoSuCo;
    TrangThai: TrangThaiSuCo;
    NgayTao: string;
    ThietBi: { TenThietBi: string };
  }>;
  HoatDongKho: Array<{
    Id: string;
    ThoiGian: string;
    LoaiHanhDong: "XUAT_KHO" | "NHAP_KHO";
    ThietBi: { TenThietBi: string };
    CaQuay: { TieuDe: string };
    NguoiThucHien: { HoTen: string };
    GiaoDichKho: { Kho: { TenKho: string } } | null;
  }>;
}
