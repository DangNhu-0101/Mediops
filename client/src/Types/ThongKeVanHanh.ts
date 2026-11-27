export type TrangThaiHienThi =
  "RANH" | "CHO_SU_DUNG" | "DANG_SU_DUNG" | "BAO_TRI";
export interface LocThongKe {
  Ky: "TOAN_BO" | "TUAN_NAY" | "THANG_NAY" | "TUY_CHON";
  TuNgay?: string;
  DenNgay?: string;
  Trang: number;
  KichThuoc: number;
  TrangNhom?: number;
  KhoId?: string;
  DanhMucId?: string;
  MauThietBiId?: string;
  TimKiem?: string;
  TrangThaiHienThi?: TrangThaiHienThi | "NGOAI_LE";
}
export const LocMacDinh: LocThongKe = {
  Ky: "TOAN_BO",
  Trang: 1,
  KichThuoc: 10,
};
export interface KyThongKe {
  BatDau: string;
  KetThuc: string;
  HienTai: string;
  ToanBo: boolean;
}
export interface SoLuongKho {
  TongSo: number;
  HienCo: number;
  DangSuDung: number;
  BaoTri: number;
  ChoSuDung: number;
  Ranh: number;
  NgoaiLe: number;
}
export interface ThietBiThongKe {
  ViTriThucTe: "TAI_KHO" | "NGOAI_KHO" | "CHUA_XAC_MINH";
  ViTriKho: string | null;
  CaDangGiu: Array<{ Id: string; TieuDe: string }>;
  Id: string;
  TenThietBi: string;
  MaQR: string;
  SoSeri: string;
  KhoId: string | null;
  TenKho: string | null;
  TenDanhMuc: string;
  MauThietBiId: string | null;
  TenMau: string | null;
  TrangThaiHienThi: TrangThaiHienThi | null;
  HienCo: boolean;
  ChanCapPhat: boolean;
  CanhBao: string[];
}
export interface TongKho {
  ChuaGanKho: number;
  NhomKho: Array<SoLuongKho & { Id: string; TenKho: string }>;
  BoLocModel: Array<{ Id: string; Ten: string; SoMay: number }>;
  TrangNhom: number;
  Ky: KyThongKe;
  ThongKe: SoLuongKho;
  TongSo: number;
  TongNhom: number;
  Trang: number;
  KichThuoc: number;
  NhomModel: Array<
    SoLuongKho & {
      Khoa: string;
      MauThietBiId: string | null;
      TenMau: string;
      TenDanhMuc: string;
    }
  >;
  DanhSach: ThietBiThongKe[];
  CacKho: Array<{ Id: string | null; TenKho: string }>;
}
export interface MauThietBi {
  Id: string;
  MaMau: string;
  TenMau: string;
  DanhMucId: string;
}
export interface MucDoMuon {
  SoMayThieuDuLieu: number;
  DanhSach: Array<{
    Id: string;
    Ten: string;
    SoLuotMuon: number;
    SoMayRiengBiet: number;
    GioNgoaiKho: number;
  }>;
  TongSo: number;
  Trang: number;
  KichThuoc: number;
  Ky: KyThongKe;
  CacKho: Array<{ Id: string; TenKho: string }>;
}
export interface LichSuMuon {
  SoMayThieuDuLieu: number;
  DanhSach: Array<{
    Id: string;
    ThoiGianXuat: string;
    ThoiGianNhap: string | null;
    TenKhoNguon: string | null;
    TenCa: string;
    GioNgoaiKho: number;
  }>;
  TongSo: number;
  SoLuotMuon: number | null;
  GioNgoaiKho: number | null;
  Trang: number;
  KichThuoc: number;
  Ky: KyThongKe;
}

export interface LichPhanCongThietBi {
  TongSo: number;
  Trang: number;
  KichThuoc: number;
  DanhSach: Array<{
    Id: string;
    TieuDe: string;
    TrangThai: string;
    ThoiGianBatDau: string;
    ThoiGianKetThuc: string;
    DuAn: { TenDuAn: string };
    KhoangChiemDung: { BatDau: string; KetThuc: string };
  }>;
}
export interface NhomTaiNguyen {
  SoLuongRiengBiet: number;
  SoLuongDuThao: number;
  SoLuotPhanCong: number;
  LuotDuThao: number;
  GioXepLich: number;
  GioChiemDung: number;
  GioDuThao: number;
  GioThucTe: null;
  TongSo: number;
  DanhSach: Array<{
    CacCa: Array<{ Id: string; TieuDe: string }>;
    TongCaLienQuan: number;
    Id: string;
    Ten: string;
    SoLuotPhanCong: number;
    LuotDuThao: number;
    GioXepLich: number;
    GioChiemDung: number;
    GioDuThao: number;
    GioThucTe: null;
  }>;
}
export interface ThongKeCa {
  TongSo: number;
  TheoTrangThai: Record<string, number>;
  TienDo: number | null;
}
export interface DuAnThongKe {
  TongSuCoToanDuAn: number | null;
  GioQuayTheoLich: number;
  TongCaTraCuu: number;
  Id: string;
  MaDuAn: string | null;
  TenDuAn: string;
  TenKhachHang: string | null;
  MoTa: string | null;
  TrangThai: string;
  HanChot: string | null;
  Ky: KyThongKe;
  ThongKeCa: ThongKeCa;
  TaiNguyen: {
    ThietBi: NhomTaiNguyen;
    NhanSu: NhomTaiNguyen;
    Studio: NhomTaiNguyen;
  };
  DanhSachCa: Array<{
    Id: string;
    MaCaQuay: string | null;
    TieuDe: string;
    TrangThai: string;
    ThoiGianBatDau: string;
    ThoiGianKetThuc: string;
    PhongStudio: { Id: string; TenPhong: string } | null;
  }>;
  SuCo: Array<{
    Id: string;
    MoTaLoi: string;
    TrangThai: string;
    NgayTao: string;
    ThietBi: { Id: string; TenThietBi: string; MaQR: string };
  }>;
  TongSuCo: number | null;
  Trang: number;
  TrangTaiNguyen: number;
  KichThuoc: number;
  PhamViCa: "TOAN_DON_VI" | "DUOC_PHAN_CONG";
}
export interface TongQuanDuAn {
  TongDuAn: number;
  TheoTrangThai: Record<string, number>;
  ThongKeCa: ThongKeCa;
  TaiNguyen: Record<
    "ThietBi" | "NhanSu" | "Studio",
    Omit<NhomTaiNguyen, "DanhSach" | "TongSo">
  >;
  PhamViCa: "TOAN_DON_VI" | "DUOC_PHAN_CONG";
}
