import { Api } from "./Api";
import type { PhuongThucQuet, TinhTrangTraThietBi } from "./VanHanhKhoService";

export interface BoLocNhatKyMuonTra {
  Trang: number;
  KichThuocTrang: number;
  TuNgay?: string;
  DenNgay?: string;
  LoaiHanhDong?: "XUAT_KHO" | "NHAP_KHO";
  KhoId?: string;
  ThietBiId?: string;
  CaQuayId?: string;
  NguoiThucHienId?: string;
}

export interface NhatKyMuonTra {
  Id: string;
  ThoiGian: string;
  LoaiHanhDong: "XUAT_KHO" | "NHAP_KHO";
  PhuongThuc: PhuongThucQuet;
  TinhTrangTra: TinhTrangTraThietBi | null;
  GhiChuTinhTrang: string | null;
  ThietBi: { Id: string; MaQR: string; TenThietBi: string };
  CaQuay: { Id: string; MaCaQuay: string | null; TieuDe: string };
  NguoiThucHien: { Id: string; HoTen: string };
  KhoNguon: { Id: string; TenKho: string } | null;
  GiaoDichKho: {
    Id: string;
    KhoangCachDenKhoMet: string;
    ViTriDat: boolean;
    Kho: { Id: string; TenKho: string };
  } | null;
}

export async function LayNhatKyMuonTra(BoLoc: BoLocNhatKyMuonTra) {
  const { data: Data } = await Api.get<{
    DanhSach: NhatKyMuonTra[];
    TongSo: number;
    Trang: number;
    KichThuocTrang: number;
  }>("/nhat-ky-muon-tra", { params: BoLoc });
  return Data;
}
