import { Api } from "./Api";
import type {
  DuAnThongKe,
  LichSuMuon,
  LichPhanCongThietBi,
  LocThongKe,
  MauThietBi,
  MucDoMuon,
  TongKho,
  TongQuanDuAn,
} from "../Types/ThongKeVanHanh";

export async function LayTongKho(Loc: LocThongKe) {
  return (await Api.get<TongKho>("/thiet-bi/tong-quan", { params: Loc })).data;
}
export async function LayMauThietBi() {
  return (await Api.get<MauThietBi[]>("/thiet-bi/model")).data;
}
export async function TaoMauThietBi(DuLieu: Omit<MauThietBi, "Id">) {
  return (await Api.post<MauThietBi>("/thiet-bi/model", DuLieu)).data;
}
export async function LayMucDoMuon(
  Loc: LocThongKe & {
    NhomTheo: "THIET_BI" | "MODEL";
    SapXep: "LUOT_MUON" | "GIO_NGOAI_KHO";
    CoSoKho: "HIEN_TAI" | "NGUON_XUAT";
  },
) {
  return (await Api.get<MucDoMuon>("/thiet-bi/muc-do-muon", { params: Loc }))
    .data;
}
export async function LayLichSuMuon(Id: string, Loc: LocThongKe) {
  return (
    await Api.get<LichSuMuon>(`/thiet-bi/${Id}/lich-su-muon`, { params: Loc })
  ).data;
}
export async function LayLichPhanCongThietBi(Id: string, Loc: LocThongKe) {
  return (
    await Api.get<LichPhanCongThietBi>(`/thiet-bi/${Id}/lich-phan-cong`, {
      params: Loc,
    })
  ).data;
}
export async function LayDuAnThongKe(
  Id: string,
  Loc: LocThongKe & { TrangTaiNguyen?: number },
) {
  return (await Api.get<DuAnThongKe>(`/du-an/${Id}`, { params: Loc })).data;
}
export async function LayTongQuanDuAn(
  Loc: LocThongKe & { TrangThai?: string },
) {
  return (await Api.get<TongQuanDuAn>("/du-an/tong-quan", { params: Loc }))
    .data;
}

export async function LayTomTatDuAn(Loc: {
  TimKiem?: string;
  TrangThai?: string;
}) {
  return (
    await Api.get<Pick<TongQuanDuAn, "TongDuAn" | "TheoTrangThai">>(
      "/du-an/tong-quan",
      { params: { ...Loc, ChiSoCoBan: true } },
    )
  ).data;
}
