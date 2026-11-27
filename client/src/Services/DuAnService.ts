import { Api } from "./Api";
import type { DuAn, DuLieuDuAn, TrangThaiDuAn } from "../Types/DuAn";

export async function LayDanhSachDuAn(ThamSo: {
  TimKiem?: string;
  TrangThai?: TrangThaiDuAn;
  Trang?: number;
  KichThuoc?: number;
}) {
  const { data: Data } = await Api.get<DuAn[]>("/du-an", { params: ThamSo });
  return Data;
}

export async function TaoDuAn(DuLieu: DuLieuDuAn) {
  await Api.post("/du-an", DuLieu);
}

export async function CapNhatDuAn(Id: string, DuLieu: DuLieuDuAn) {
  await Api.put(`/du-an/${Id}`, DuLieu);
}

export async function XoaDuAn(Id: string) {
  await Api.delete(`/du-an/${Id}`);
}
