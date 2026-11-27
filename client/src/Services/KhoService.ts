import { Api } from "./Api";
import type { DuLieuKho, KhoQuanLy, KhoThongKe } from "../Types/Kho";
import type { LocThongKe } from "../Types/ThongKeVanHanh";

export async function LayDanhSachKhoQuanLy(ThamSo: {
  TimKiem?: string;
  DangHoatDong?: boolean;
}) {
  const { data: Data } = await Api.get<KhoQuanLy[]>("/kho", { params: ThamSo });
  return Data;
}

export async function LayTongQuanKho(Id: string, Loc: LocThongKe) {
  const { data: Data } = await Api.get<KhoThongKe>(`/kho/${Id}/tong-quan`, {
    params: Loc,
  });
  return Data;
}

export async function TaoKho(DuLieu: DuLieuKho) {
  const { data: Data } = await Api.post<KhoQuanLy>("/kho", DuLieu);
  return Data;
}

export async function CapNhatKho(Id: string, DuLieu: DuLieuKho) {
  const { data: Data } = await Api.put<KhoQuanLy>(`/kho/${Id}`, DuLieu);
  return Data;
}

export async function CapNhatTrangThaiKho(Id: string, DangHoatDong: boolean) {
  const { data: Data } = await Api.patch<KhoQuanLy>(`/kho/${Id}/trang-thai`, {
    DangHoatDong: DangHoatDong,
  });
  return Data;
}

export async function XoaKho(Id: string) {
  await Api.delete(`/kho/${Id}`);
}

export async function LayTrangKhoQuanLy(ThamSo: {
  TimKiem?: string;
  DangHoatDong?: boolean;
  Trang: number;
  KichThuoc: number;
}) {
  return (
    await Api.get<{ DanhSach: KhoQuanLy[]; TongSo: number }>("/kho", {
      params: ThamSo,
    })
  ).data;
}
