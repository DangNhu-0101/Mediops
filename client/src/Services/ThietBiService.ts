import { Api } from "./Api";
import type { LocThongKe } from "../Types/ThongKeVanHanh";
import type {
  DanhMucThietBi,
  DuLieuThietBi,
  ThietBi,
  ThietBiLuaChon,
  TrangThaiThietBi,
  Kho,
} from "../Types/ThietBi";
export async function LayThietBiLuaChon() {
  return (await Api.get<ThietBiLuaChon[]>("/thiet-bi/lua-chon")).data;
}
export async function LayKhoLuaChon() {
  return (
    await Api.get<Array<Kho & { DangHoatDong: boolean }>>(
      "/thiet-bi/kho-lua-chon",
    )
  ).data;
}

export async function LayDanhSachThietBi(
  ThamSo: Partial<LocThongKe> & {
    TimKiem?: string;
    DanhMucId?: string;
    TrangThai?: TrangThaiThietBi;
    KhoId?: string;
    ChuaGanKho?: boolean;
  },
) {
  const { data: Data } = await Api.get<ThietBi[]>("/thiet-bi", {
    params: ThamSo,
  });
  return Data;
}
export async function LayDanhMucThietBi() {
  const { data: Data } = await Api.get<DanhMucThietBi[]>("/thiet-bi/danh-muc");
  return Data;
}
export async function LayChiTietThietBi(Id: string) {
  const { data: Data } = await Api.get<ThietBi>(`/thiet-bi/${Id}`);
  return Data;
}
export async function TraCuuThietBiTheoQR(MaQR: string) {
  const { data: Data } = await Api.get<ThietBi>(
    `/thiet-bi/tra-cuu-qr/${encodeURIComponent(MaQR)}`,
  );
  return Data;
}
function TaoDuLieuGui(DuLieu: DuLieuThietBi, TepAnh?: File) {
  const BieuMau = new FormData();
  Object.entries(DuLieu).forEach(([Khoa, GiaTri]) => {
    if (
      GiaTri !== undefined &&
      (GiaTri !== "" || ["KhoId", "MauThietBiId"].includes(Khoa))
    )
      BieuMau.append(Khoa, GiaTri);
  });
  if (TepAnh) BieuMau.append("TepAnh", TepAnh);
  return BieuMau;
}
export async function TaoThietBi(DuLieu: DuLieuThietBi, TepAnh?: File) {
  const { data: Data } = await Api.post<ThietBi>(
    "/thiet-bi",
    TaoDuLieuGui(DuLieu, TepAnh),
  );
  return Data;
}
export async function CapNhatThietBi(
  Id: string,
  DuLieu: DuLieuThietBi,
  TepAnh?: File,
) {
  const { data: Data } = await Api.put<ThietBi>(
    `/thiet-bi/${Id}`,
    TaoDuLieuGui(DuLieu, TepAnh),
  );
  return Data;
}
export async function XoaThietBi(Id: string) {
  await Api.delete(`/thiet-bi/${Id}`);
}
