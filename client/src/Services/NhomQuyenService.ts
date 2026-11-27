import { Api } from "./Api";
import type {
  ChucDanh,
  DanhSachNhomQuyen,
  DuLieuNhomQuyen,
  NhomQuyen,
} from "../Types/NhomQuyen";

export async function LayDanhSachNhomQuyen() {
  const { data: Data } = await Api.get<DanhSachNhomQuyen>("/nhom-quyen");
  return Data;
}
export async function TaoNhomQuyen(DuLieu: DuLieuNhomQuyen) {
  const { data: Data } = await Api.post<NhomQuyen>("/nhom-quyen", DuLieu);
  return Data;
}
export async function CapNhatNhomQuyen(Id: string, DuLieu: DuLieuNhomQuyen) {
  await Api.put(`/nhom-quyen/${Id}`, DuLieu);
}
export async function XoaNhomQuyen(Id: string) {
  await Api.delete(`/nhom-quyen/${Id}`);
}

export async function LayDanhSachChucDanh() {
  const { data: Data } = await Api.get<ChucDanh[]>("/chuc-danh");
  return Data;
}
export async function TaoChucDanh(TenChucDanh: string) {
  await Api.post("/chuc-danh", { TenChucDanh });
}
export async function CapNhatChucDanh(
  Id: string,
  DuLieu: { TenChucDanh?: string; DangSuDung?: boolean },
) {
  await Api.put(`/chuc-danh/${Id}`, DuLieu);
}
export async function XoaChucDanh(Id: string) {
  await Api.delete(`/chuc-danh/${Id}`);
}
