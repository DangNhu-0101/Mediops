import axios from "axios";
import { Api } from "./Api";
import type {
  CaQuay,
  ChiTietCaQuay,
  DuLieuCapNhatCaQuay,
  DuLieuDoiLichCaQuay,
  DuLieuKiemTraXungDotCaQuay,
  DuLieuNhanBanCaQuay,
  DuLieuTaoCaQuay,
  KetQuaXungDotCaQuay,
  KetQuaGiaiQuyetXungDot,
  PhanHoiGoiYThietBiThayThe,
  PhanHoiXungDotCaQuay,
} from "../Types/CaQuay";

export async function LayDanhSachCaQuay() {
  const { data: Data } = await Api.get<CaQuay[]>("/ca-quay");
  return Data;
}

export async function CapNhatThoiGianCaQuay(
  Id: string,
  DuLieu: DuLieuDoiLichCaQuay,
) {
  const { data: Data } = await Api.put<CaQuay>(`/ca-quay/${Id}`, DuLieu);
  return Data;
}

export async function KiemTraXungDotCaQuay(DuLieu: DuLieuKiemTraXungDotCaQuay) {
  const { data: Data } = await Api.post<KetQuaXungDotCaQuay>(
    "/ca-quay/kiem-tra-xung-dot",
    DuLieu,
  );
  return Data;
}

export async function LayChiTietCaQuay(Id: string) {
  const { data: Data } = await Api.get<ChiTietCaQuay>(`/ca-quay/${Id}`);
  return Data;
}

export async function CapNhatCaQuay(Id: string, DuLieu: DuLieuCapNhatCaQuay) {
  const { data: Data } = await Api.put<ChiTietCaQuay>(`/ca-quay/${Id}`, DuLieu);
  return Data;
}

export async function NhanBanCaQuay(DuLieu: DuLieuNhanBanCaQuay) {
  return TaoCaQuay(DuLieu);
}

export async function TaoCaQuay(DuLieu: DuLieuTaoCaQuay) {
  const { data: Data } = await Api.post<CaQuay>("/ca-quay", DuLieu);
  return Data;
}

export async function XoaCaQuay(Id: string) {
  await Api.delete(`/ca-quay/${Id}`);
}

export async function GoiYThietBiThayThe(ThamSo: {
  ThietBiGocId: string;
  CaQuayId: string;
  ThoiGianBatDau?: string;
  ThoiGianKetThuc?: string;
}) {
  const { data: Data } = await Api.get<PhanHoiGoiYThietBiThayThe>(
    "/ca-quay/goi-y-thay-the",
    { params: ThamSo },
  );
  return Data.DanhSachGoiY;
}

export async function GoiYGiaiQuyetXungDotCaQuay(CaQuayId: string) {
  const { data: Data } = await Api.post<KetQuaGiaiQuyetXungDot>(
    `/ca-quay/${CaQuayId}/goi-y-giai-quyet-xung-dot`,
  );
  return Data;
}

export async function ApDungPhuongAnGiaiQuyet(ThamSo: {
  CaQuayId: string;
  PhuongAnId: string;
  MaPhienBan: string;
}) {
  const { data: Data } = await Api.post<{ DaApDung: true; PhuongAnId: string }>(
    `/ca-quay/${ThamSo.CaQuayId}/ap-dung-giai-phap`,
    {
      PhuongAnId: ThamSo.PhuongAnId,
      MaPhienBan: ThamSo.MaPhienBan,
    },
  );
  return Data;
}

export function LayPhanHoiXungDotCaQuay(
  Loi: unknown,
): PhanHoiXungDotCaQuay | null {
  if (
    !axios.isAxiosError<PhanHoiXungDotCaQuay>(Loi) ||
    Loi.response?.status !== 409 ||
    Loi.response.data?.MaLoi !== "XUNG_DOT_LICH_CA_QUAY" ||
    !Array.isArray(Loi.response.data.DanhSachXungDot)
  ) {
    return null;
  }
  return Loi.response.data;
}
