import { Api } from "./Api";
import type { DuLieuNhanSu, NhanSu } from "../Types/NhanSu";
export async function LayDanhSachNhanSu(ThamSo: {
  TimKiem?: string;
  NhomQuyenId?: string;
  ChucDanhId?: string;
}) {
  const { data: Data } = await Api.get<NhanSu[]>("/nhan-su", {
    params: ThamSo,
  });
  return Data;
}
export async function TaoNhanSu(DuLieu: DuLieuNhanSu) {
  await Api.post("/nhan-su", DuLieu);
}
export async function CapNhatNhanSu(Id: string, DuLieu: DuLieuNhanSu) {
  await Api.put(`/nhan-su/${Id}`, DuLieu);
}
export async function XoaNhanSu(Id: string) {
  await Api.delete(`/nhan-su/${Id}`);
}
