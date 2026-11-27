import { Api } from "./Api";
import type { CaQuayVanHanh } from "../Types/CaQuay";
import type { Kho } from "../Types/ThietBi";

export type PhuongThucQuet = "QUET_QR_CAMERA" | "NHAP_TAY";
export type TinhTrangTraThietBi = "BINH_THUONG" | "CAN_KIEM_TRA" | "HU_HONG";

export interface BangChungViTri {
  ViDo: number;
  KinhDo: number;
  DoChinhXacMet: number;
  ThoiDiemGhiNhan: string;
}

export interface ChecklistXuatKho {
  Id: string;
  MaCaQuay: string | null;
  TieuDe: string;
  TrangThai: string;
  DuAn: { TenDuAn: string };
  DanhSachThietBi: Array<{
    Id: string;
    TrangThaiMuonTra: string;
    LoThayTheId: string | null;
    HieuLucDen: string | null;
    ThietBi: {
      Id: string;
      MaQR: string;
      TenThietBi: string;
      TrangThai: string;
      ViTriKho: string | null;
      Kho: (Kho & { DangHoatDong: boolean }) | null;
    };
  }>;
}

export interface ChecklistNhapKho {
  Id: string;
  MaCaQuay: string | null;
  TieuDe: string;
  TrangThai: string;
  DuAn: { TenDuAn: string };
  DanhSachThietBi: Array<{
    Id: string;
    TrangThaiMuonTra: "DA_XUAT_KHO";
    ThietBi: {
      Id: string;
      MaQR: string;
      TenThietBi: string;
      TrangThai: string;
      Kho: { Id: string; MaKho: string; TenKho: string; DiaChi: string } | null;
    };
  }>;
}

export async function LayCaQuayCuaNguoiDung(Ngay: string) {
  const { data: Data } = await Api.get<CaQuayVanHanh[]>(
    "/van-hanh-kho/ca-quay-hom-nay",
    { params: { Ngay: Ngay } },
  );
  return Data;
}

export async function LayDanhSachKho(BaoGomKhoNgungHoatDong = false) {
  const { data: Data } = await Api.get<Kho[]>("/van-hanh-kho/kho", {
    params: BaoGomKhoNgungHoatDong
      ? { BaoGomKhoNgungHoatDong: true }
      : undefined,
  });
  return Data;
}

export async function LayChecklistXuatKho(CaQuayId: string) {
  const { data: Data } = await Api.get<ChecklistXuatKho>(
    `/van-hanh-kho/checklist/${CaQuayId}`,
  );
  return Data;
}

export async function LayChecklistNhapKho(CaQuayId: string) {
  const { data: Data } = await Api.get<ChecklistNhapKho>(
    `/van-hanh-kho/checklist-nhap/${CaQuayId}`,
  );
  return Data;
}

export async function TraCuuThietBiXuatKho(ThamSo: {
  CaQuayId: string;
  KhoId: string;
  MaQR: string;
}) {
  const { data: Data } = await Api.get<{
    Id: string;
    MaQR: string;
    TenThietBi: string;
    TrangThai: string;
    Kho: { Id: string; TenKho: string };
  }>("/van-hanh-kho/quet-thiet-bi", { params: ThamSo });
  return Data;
}

export async function TraCuuThietBiNhapKho(ThamSo: {
  CaQuayId: string;
  MaQR: string;
}) {
  const { data: Data } = await Api.get<{
    Id: string;
    MaQR: string;
    TenThietBi: string;
    TrangThai: string;
    Kho: { Id: string; TenKho: string } | null;
  }>("/van-hanh-kho/quet-thiet-bi-nhap", { params: ThamSo });
  return Data;
}

export async function KiemTraViTriKho(KhoId: string, ViTri: BangChungViTri) {
  const { data: Data } = await Api.post<{
    Kho: { Id: string; TenKho: string; BanKinhXacMinhMet: number };
    KhoangCachMet: number;
    ViTriDat: true;
    HetHanLuc: string;
  }>("/van-hanh-kho/kiem-tra-vi-tri", { KhoId: KhoId, ViTri: ViTri });
  return Data;
}

export async function XuatKho(DuLieu: {
  LoThayTheId?: string;
  CaQuayId: string;
  KhoId: string;
  DanhSachThietBi: Array<{
    ThietBiId: string;
    MaQR: string;
    PhuongThuc: PhuongThucQuet;
  }>;
  ViTri: BangChungViTri;
}) {
  const { data: Data } = await Api.post<{
    GiaoDichId: string;
    KhoId: string;
    TenKho: string;
    SoThietBi: number;
    KhoangCachMet: number;
    ThoiGian: string;
  }>("/van-hanh-kho/xuat-kho", DuLieu);
  return Data;
}

export async function NhapKho(DuLieu: {
  CaQuayId: string;
  KhoDichId: string;
  DanhSachThietBi: Array<{
    ThietBiId: string;
    MaQR: string;
    PhuongThuc: PhuongThucQuet;
    TinhTrang: TinhTrangTraThietBi;
    GhiChu?: string;
  }>;
  ViTri: BangChungViTri;
}) {
  const { data: Data } = await Api.post<{
    GiaoDichId: string;
    KhoDichId: string;
    TenKhoDich: string;
    SoThietBi: number;
    SoChuyenKho: number;
    KhoangCachMet: number;
    ThoiGian: string;
  }>("/van-hanh-kho/nhap-kho", DuLieu);
  return Data;
}
