import { Api } from "./Api";
import type { DuLieuBangDieuKhien } from "../Types/BangDieuKhien";

export async function LayDuLieuBangDieuKhien() {
  const { data: Data } = await Api.get<DuLieuBangDieuKhien>("/bang-dieu-khien");
  return Data;
}
