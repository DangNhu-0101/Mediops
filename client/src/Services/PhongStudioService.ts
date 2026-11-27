import { Api } from "./Api";
import type {
  DuLieuPhongStudio,
  PhongStudio,
  TrangThaiStudio,
} from "../Types/PhongStudio";

export async function LayDanhSachPhongStudio(ThamSo: {
  TimKiem?: string;
  TrangThai?: TrangThaiStudio;
}) {
  const { data: Data } = await Api.get<PhongStudio[]>("/phong-studio", {
    params: ThamSo,
  });
  return Data;
}

export async function TaoPhongStudio(DuLieu: DuLieuPhongStudio) {
  await Api.post("/phong-studio", DuLieu);
}

export async function CapNhatPhongStudio(
  Id: string,
  DuLieu: DuLieuPhongStudio,
) {
  await Api.put(`/phong-studio/${Id}`, DuLieu);
}

export async function XoaPhongStudio(Id: string) {
  await Api.delete(`/phong-studio/${Id}`);
}
