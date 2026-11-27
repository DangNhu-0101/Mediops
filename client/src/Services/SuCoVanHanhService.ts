import { Api } from "./Api";
import type { DuLieuBaoSuCoVanHanh } from "../Types/HopDongSuCoVanHanh";
import type {
  DanhGiaYeuCauTaiNguyen,
  PhuongAnGiaiQuyetXungDot,
} from "../Types/CaQuay";

export interface TaiNguyenSuCo {
  Loai: "THIET_BI" | "NHAN_SU" | "STUDIO";
  Id: string;
  Ten: string;
  ThanhPhan?: string;
}
export interface AnhSuCo {
  Id: string;
  SecureUrl: string;
}
export interface SuCoVanHanh {
  Id: string;
  CaQuayId: string | null;
  Nhom: DuLieuBaoSuCoVanHanh["Nhom"];
  NguyenNhan: string;
  MucAnhHuong: DuLieuBaoSuCoVanHanh["MucAnhHuong"];
  MoTa: string;
  TrangThai:
    "MOI_BAO" | "DA_XAC_MINH" | "DANG_XU_LY" | "DA_KHOI_PHUC" | "DA_HUY";
  ThoiDiemXayRa: string;
  NgayTao: string;
  DuKienPhucHoi: string | null;
  KetThucAnhHuong: string | null;
  TaiNguyen: TaiNguyenSuCo[];
  DanhSachAnh: AnhSuCo[];
  BaoTri: { Id: string; ThietBiId: string; DanhSachAnh: AnhSuCo[] }[];
  CaQuay: { Id: string; TieuDe: string } | null;
  LichSu: {
    Id: string;
    NoiDung: string;
    NgayTao: string;
    NguoiThucHien: string;
  }[];
  LoThayThe: {
    NguoiPhuTrach: string;
    Id: string;
    ThoiDiemHieuLuc: string;
    ThoiDiemBanGiao: string | null;
    DanhSachPhanCong: { ThietBiId: string; TrangThaiMuonTra: string }[];
  }[];
}
export interface AnhHuongSuCo {
  MaPhienBan: string;
  CanhBao: string;
  MocQuyetDinh: string | null;
  DanhGiaYeuCau: DanhGiaYeuCauTaiNguyen | null;
  DanhSachPhuongAn: PhuongAnGiaiQuyetXungDot[];
  CaLienQuan: { Id: string; TieuDe: string; ThoiGianBatDau: string }[];
}
export async function LayNguCanhSuCo(ThamSo: {
  CaQuayId?: string;
  ThietBiId?: string;
}) {
  return (
    await Api.get<{
      CaQuayId?: string;
      CoTheBao: boolean;
      TenNguCanh: string;
      TaiNguyen: TaiNguyenSuCo[];
    }>("/su-co-van-hanh/ngu-canh", { params: ThamSo })
  ).data;
}
export interface CanhBaoTraTre {
  Id: string;
  ThietBi: { TenThietBi: string };
  CaQuay: { TieuDe: string; ThoiGianKetThuc: string };
}
export async function LaySuCoVanHanh(ThamSo: {
  CaQuayId?: string;
  ThietBiId?: string;
  DuAnId?: string;
  Trang: number;
}) {
  return (
    await Api.get<{
      DanhSach: SuCoVanHanh[];
      TongSo: number;
      CanhBaoTraTre: CanhBaoTraTre[];
    }>("/su-co-van-hanh", { params: ThamSo })
  ).data;
}
export async function BaoSuCoVanHanh(DuLieu: DuLieuBaoSuCoVanHanh) {
  return (await Api.post<SuCoVanHanh>("/su-co-van-hanh", DuLieu)).data;
}
export async function ThemAnhVanHanh(
  Id: string,
  DanhSachAnh: File[],
  MaLanTai: string,
) {
  const BieuMau = new FormData();
  BieuMau.append("MaLanTai", MaLanTai);
  DanhSachAnh.forEach((Anh) => BieuMau.append("AnhSuCo", Anh));
  return (await Api.post<SuCoVanHanh>(`/su-co-van-hanh/${Id}/anh`, BieuMau))
    .data;
}
export async function CapNhatSuCoVanHanh(
  Id: string,
  DuLieu: {
    TrangThai: SuCoVanHanh["TrangThai"];
    NoiDung: string;
    KetThucAnhHuong: string | null;
    DuKienPhucHoi: string | null;
  },
) {
  return (await Api.put<SuCoVanHanh>(`/su-co-van-hanh/${Id}`, DuLieu)).data;
}
export async function PhanTichSuCo(Id: string, HieuLuc: string) {
  return (
    await Api.post<AnhHuongSuCo>(`/su-co-van-hanh/${Id}/phan-tich`, { HieuLuc })
  ).data;
}
export async function ApDungThayMay(
  Id: string,
  DuLieu: {
    HieuLuc: string;
    PhuongAnId: string;
    MaPhienBan: string;
    NguoiPhuTrachId: string;
    XacNhanGiaoNhan: true;
  },
) {
  return (await Api.post(`/su-co-van-hanh/${Id}/ap-dung`, DuLieu)).data;
}
export async function XacNhanBanGiao(
  Id: string,
  LoId: string,
  NoiDung: string,
) {
  return (await Api.post(`/su-co-van-hanh/${Id}/ban-giao`, { LoId, NoiDung }))
    .data;
}

export function GioNhapVietNam(Ngay = new Date()) {
  const Phan = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(Ngay);
  return Phan.replace(" ", "T");
}
export function GioGuiMayChu(GiaTri: string) {
  return new Date(`${GiaTri}:00+07:00`).toISOString();
}
export function GioHienThi(GiaTri: string) {
  return new Date(GiaTri).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}
