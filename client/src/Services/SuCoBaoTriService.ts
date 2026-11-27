import type {
  DuLieuBaoSuCo,
  MucDoSuCo,
  SuCoBaoTri,
  TrangThaiSuCo,
} from "../Types/SuCoBaoTri";
import type { TrangThaiThietBi } from "../Types/ThietBi";
import { Api } from "./Api";

function TaoBieuMau(DuLieu: DuLieuBaoSuCo, DanhSachAnh: File[]) {
  const BieuMau = new FormData();
  Object.entries(DuLieu).forEach(([Ten, GiaTri]) => {
    if (GiaTri) BieuMau.append(Ten, GiaTri);
  });
  DanhSachAnh.forEach((Tep) => BieuMau.append("AnhSuCo", Tep));
  return BieuMau;
}

export async function LayDanhSachSuCo(ThamSo?: {
  TrangThai?: TrangThaiSuCo;
  MucDo?: MucDoSuCo;
  ThietBiId?: string;
  KhoId?: string;
  TimKiem?: string;
}) {
  const { data: Data } = await Api.get<SuCoBaoTri[]>("/su-co-bao-tri", {
    params: ThamSo,
  });
  return Data;
}

export async function LayChiTietSuCo(Id: string) {
  const { data: Data } = await Api.get<SuCoBaoTri>(`/su-co-bao-tri/${Id}`);
  return Data;
}

export async function BaoSuCo(DuLieu: DuLieuBaoSuCo, DanhSachAnh: File[]) {
  const { data: Data } = await Api.post<SuCoBaoTri>(
    "/su-co-bao-tri",
    TaoBieuMau(DuLieu, DanhSachAnh),
  );
  return Data;
}

export async function BoSungAnhSuCo(
  Id: string,
  DanhSachAnh: File[],
  BoAnhId: string[] = [],
) {
  const BieuMau = new FormData();
  DanhSachAnh.forEach((Tep) => BieuMau.append("AnhSuCo", Tep));
  const { data: Data } = await Api.post<SuCoBaoTri>(
    `/su-co-bao-tri/${Id}/anh`,
    BieuMau,
  );
  return Data;
}

export async function BatDauXuLySuCo(Id: string) {
  const { data: Data } = await Api.post<SuCoBaoTri>(
    `/su-co-bao-tri/${Id}/bat-dau`,
  );
  return Data;
}

export async function HoanTatXuLySuCo(
  Id: string,
  DuLieu: {
    GhiChuXuLy: string;
    TrangThaiThietBi: Extract<
      TrangThaiThietBi,
      "SAN_SANG" | "BAO_TRI" | "HU_HONG"
    >;
  },
) {
  const { data: Data } = await Api.put<SuCoBaoTri>(
    `/su-co-bao-tri/${Id}/hoan-tat`,
    DuLieu,
  );
  return Data;
}
