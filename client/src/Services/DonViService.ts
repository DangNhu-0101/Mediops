import { Api } from "./Api";
import type { DonVi, DuLieuDonVi, DuLieuTaoDonVi } from "../Types/DonVi";

export async function LayDanhSachDonVi() {
  const { data: Data } = await Api.get<DonVi[]>("/quan-tri-he-thong/don-vi");
  return Data;
}

export async function TaoDonVi(DuLieu: DuLieuTaoDonVi) {
  const { data: Data } = await Api.post<DonVi>(
    "/quan-tri-he-thong/don-vi",
    DuLieu,
  );
  return Data;
}

export async function CapNhatDonVi(Id: string, DuLieu: DuLieuDonVi) {
  const { data: Data } = await Api.put<DonVi>(
    `/quan-tri-he-thong/don-vi/${Id}`,
    DuLieu,
  );
  return Data;
}
