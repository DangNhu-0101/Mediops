import type { YeuCauTaiNguyen, YeuCauHienThi } from "./DuLieuNhung";
export type TrangThaiCaQuay =
  "DU_THAO" | "DA_DUYET" | "DANG_DIEN_RA" | "HOAN_THANH" | "DA_HUY";

export type LoaiTaiNguyenXungDot = "STUDIO" | "THIET_BI" | "NHAN_SU";
export type LoaiXungDotCaQuay =
  | "TRUNG_LICH_CA_QUAY"
  | "KHONG_KHA_DUNG"
  | "TRANG_THAI_KHONG_CHO_PHEP"
  | "CHUA_HOAN_TRA"
  | "SU_CO_CHUA_XU_LY";

export interface ChiTietXungDotCaQuay {
  LoaiTaiNguyen: LoaiTaiNguyenXungDot;
  TaiNguyenId: string;
  TenTaiNguyen: string;
  LoaiXungDot: LoaiXungDotCaQuay;
  ViTriNguoi?: "NGUOI_PHU_TRACH" | "NHAN_SU";
  TrangThaiTaiNguyen?: string;
  CaQuayBiTrung?: {
    Id: string;
    MaCaQuay: string | null;
    TieuDe: string;
    ThoiGianBatDau: string;
    ThoiGianKetThuc: string;
  };
  KhoangKhongKhaDung?: {
    Id: string;
    BatDau: string;
    KetThuc: string;
    LyDo: string | null;
  };
  MuonTraQuaHan?: {
    CaQuayId: string;
    TieuDeCaQuay: string;
    ThoiGianKetThuc: string;
  };
}

export interface PhanHoiXungDotCaQuay {
  ThongBao: string;
  MaLoi: "XUNG_DOT_LICH_CA_QUAY";
  DanhSachXungDot: ChiTietXungDotCaQuay[];
}

export interface DuLieuKiemTraXungDotCaQuay {
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
  PhongStudioId?: string | null;
  DanhSachThietBiId?: string[];
  DanhSachNhanSuId?: string[];
  NguoiPhuTrachId?: string;
  CaQuayHienTaiId?: string;
  ThoiGianChuanBiPhut?: number;
  ThoiGianThuHoiPhut?: number;
}

export interface KetQuaXungDotCaQuay {
  CoXungDot: boolean;
  DanhSachXungDot: ChiTietXungDotCaQuay[];
}

export interface SoSanhThongSoThietBi {
  TenThongSo: string;
  GiaTriGoc: unknown;
  GiaTriUngVien?: unknown;
  MucTuongDong: number;
}

export interface ThietBiDeXuat {
  ThietBi: {
    Id: string;
    MaQR: string;
    SoSeri: string;
    TenThietBi: string;
    DanhMucId: string;
    ThongSoKyThuat: unknown;
    TrangThai: string;
    HinhAnhUrl: string | null;
    ViTriKho: string | null;
    DanhMuc: { Id: string; TenDanhMuc: string };
  };
  DiemTuongDong: number;
  TyLePhanTram: string;
  ThongSoTuongDong: SoSanhThongSoThietBi[];
  ThongSoKhacBiet: SoSanhThongSoThietBi[];
  ThongSoThieu: SoSanhThongSoThietBi[];
  KhaDung: boolean;
  TuongThichKyThuat: {
    HopLe: boolean;
    CanThietBiTrungGian: boolean;
    ThietBiTrungGian: Array<{ Id: string; TenThietBi: string }>;
    DienGiai: string[];
  };
  LyDoGoiY: string;
  DanhGiaYeuCau?: DanhGiaYeuCauTaiNguyen;
}

export interface DanhGiaYeuCauTaiNguyen {
  TrangThai: "DAP_UNG" | "KHONG_DAP_UNG" | "CHUA_DU_DU_LIEU";
  DapUngBatBuoc: boolean;
  DiemUuTien: number;
  DienGiai: string[];
}

export interface PhanHoiGoiYThietBiThayThe {
  DanhSachGoiY: ThietBiDeXuat[];
}

export type NhomPhuongAnGiaiQuyet =
  | "GIU_NGUYEN_LICH"
  | "DIEU_CHINH_THOI_GIAN"
  | "THAY_DOI_TAI_NGUYEN"
  | "THUE_NGOAI"
  | "CAN_XU_LY_THU_CONG";

export interface ThayDoiPhuongAnGiaiQuyet {
  ThietBiBoSung?: Array<{ Id: string; TenThietBi: string }>;
  ThoiGian?: { BatDau: string; KetThuc: string };
  Studio?: { TuId: string | null; DenId: string; TenStudio: string };
  ThietBi?: Array<{
    TuId: string;
    TenThietBiGoc: string;
    DenId?: string;
    TenThietBiMoi: string;
    Nguon: "NOI_BO" | "THUE_NGOAI";
    TinhTrangXacNhan?: "CAN_LIEN_HE";
    DiemTuongDong?: number;
  }>;
  NhanSu?: Array<{
    TuId: string;
    TenNhanSuGoc: string;
    DenId: string;
    TenNhanSuMoi: string;
    ChucDanhPhanCong: string;
  }>;
  NguoiPhuTrach?: {
    TuId: string;
    TenNguoiGoc: string;
    DenId: string;
    TenNguoiMoi: string;
  };
}

export interface PhuongAnGiaiQuyetXungDot {
  SoSanh?: Array<{
    TieuChi: string;
    DangCan: string;
    DeXuat: string;
    KetLuan: string;
  }>;
  ViTriDeXuat?: string;
  Id: string;
  LoaiChienLuoc: string;
  Nhom: NhomPhuongAnGiaiQuyet;
  TieuDe: string;
  GiaiThich: string;
  ThayDoi: ThayDoiPhuongAnGiaiQuyet;
  XungDotDaGiaiQuyet: string[];
  XungDotConLai: ChiTietXungDotCaQuay[];
  KhaThi: "KHA_THI" | "CAN_XAC_NHAN" | "TU_VAN";
  ApDungDuoc: boolean;
  DanhSachDanhDoi: string[];
  ChiPhiBoSung: {
    SoTien: string | null;
    DonViTien: "VND";
    Nhan: string;
  };
  AnhHuongThoiGianPhut: number;
  DoDayDuDuLieu: "DAY_DU" | "MOT_PHAN" | "HAN_CHE";
  TieuChiXepHang: string[];
  ThuTuUuTien: number;
  DanhGiaYeuCau?: DanhGiaYeuCauTaiNguyen;
}

export interface KetQuaGiaiQuyetXungDot {
  CaQuayId: string;
  MaPhienBan: string;
  DanhSachXungDot: ChiTietXungDotCaQuay[];
  DanhSachPhuongAn: PhuongAnGiaiQuyetXungDot[];
  ThongBao: string;
}

export interface CaQuay {
  CacYeuCauTaiNguyen?: YeuCauTaiNguyen[];
  Id: string;
  MaCaQuay: string | null;
  TieuDe: string;
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
  GhiChuDiaDiem: string | null;
  TrangThai: TrangThaiCaQuay;
  PhongStudio: { Id: string; TenPhong: string; DiaDiem: string | null } | null;
  DuAn: { Id: string; TenDuAn: string };
  _count: { DanhSachThietBi: number };
}

export interface CaQuayVanHanh extends Omit<CaQuay, "_count"> {
  TomTatThietBi: {
    TongSo: number;
    ChoXuatKho: number;
    DaXuatKho: number;
    DaNhapKho: number;
  };
}

export interface DuLieuDoiLichCaQuay {
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
}

export interface PhanCongThietBi {
  HieuLucTu: string | null;
  HieuLucDen: string | null;
  LoThayTheId: string | null;
  Id: string;
  ThietBiId: string;
  GhiChu: string | null;
  TrangThaiMuonTra: string;
  ThietBi: {
    Id: string;
    MaQR: string;
    SoSeri: string;
    TenThietBi: string;
    TrangThai: string;
    ViTriKho: string | null;
    KhoId: string | null;
    DanhMuc: { TenDanhMuc: string };
    Kho: {
      Id: string;
      MaKho: string;
      TenKho: string;
      DiaChi: string;
      BanKinhXacMinhMet: number;
      DangHoatDong: boolean;
    } | null;
  };
}

export interface PhanCongNhanSu {
  HieuLucTu?: string | null;
  HieuLucDen?: string | null;
  Id: string;
  NguoiDungId: string;
  ChucDanhPhanCong: string;
  NguoiDung: {
    Id: string;
    HoTen: string;
    ChucDanh: { TenChucDanh: string } | null;
  };
}

export interface ChiTietCaQuay extends Omit<CaQuay, "_count"> {
  NguoiPhuTrachHieuLucTu?: string | null;
  CacYeuCauHienThi?: YeuCauHienThi[];
  PhongStudioId: string | null;
  NguoiPhuTrachId: string;
  GhiChu: string | null;
  MucDoUuTien: number;
  CoTheDoiLich: boolean;
  ThoiGianBatDauSomNhat: string | null;
  ThoiGianKetThucMuonNhat: string | null;
  ThoiGianChuanBiPhut: number;
  ThoiGianThuHoiPhut: number;
  NguoiPhuTrach: {
    Id: string;
    HoTen: string;
    ChucDanh: { TenChucDanh: string } | null;
  };
  DanhSachThietBi: PhanCongThietBi[];
  DanhSachNhanSu: PhanCongNhanSu[];
}

export interface DuLieuCapNhatCaQuay {
  CacYeuCauTaiNguyen?: YeuCauTaiNguyen[];
  TieuDe?: string;
  ThoiGianBatDau?: string;
  ThoiGianKetThuc?: string;
  PhongStudioId?: string | null;
  GhiChuDiaDiem?: string;
  NguoiPhuTrachId?: string;
  TrangThai?: TrangThaiCaQuay;
  GhiChu?: string;
  MucDoUuTien?: number;
  CoTheDoiLich?: boolean;
  ThoiGianBatDauSomNhat?: string | null;
  ThoiGianKetThucMuonNhat?: string | null;
  ThoiGianChuanBiPhut?: number;
  ThoiGianThuHoiPhut?: number;
  DanhSachThietBiId?: string[];
  DanhSachNhanSu?: { NguoiDungId: string; ChucDanhPhanCong: string }[];
}

export interface DuLieuTaoCaQuay {
  CacYeuCauTaiNguyen?: YeuCauTaiNguyen[];
  DuAnId: string;
  TieuDe: string;
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
  PhongStudioId?: string | null;
  GhiChuDiaDiem?: string;
  NguoiPhuTrachId: string;
  TrangThai: TrangThaiCaQuay;
  GhiChu?: string;
  MucDoUuTien?: number;
  CoTheDoiLich?: boolean;
  ThoiGianChuanBiPhut?: number;
  ThoiGianThuHoiPhut?: number;
  DanhSachThietBiId: string[];
  DanhSachNhanSu: { NguoiDungId: string; ChucDanhPhanCong: string }[];
}

export type DuLieuNhanBanCaQuay = DuLieuTaoCaQuay;
