import { Api } from "./Api";
import type { AnhHuongSuCo } from "./SuCoVanHanhService";

export const NhanLoiMoi: Record<string, string> = {
  RUT_DONG_Y: "Đã rút đồng ý",
  CHO_PHAN_HOI: "Chờ phản hồi",
  DA_DONG_Y: "Đã đồng ý, chờ chốt",
  DA_TU_CHOI: "Đã từ chối",
  HET_HAN: "Hết hạn",
  DA_HUY: "Đã hủy",
  DA_PHAN_CONG: "Đã phân công",
};
export interface LoiMoi {
  Id: string;
  PhuongAnId: string;
  NguoiNhanId: string;
  ChucDanhPhanCong: string;
  TrangThai: string;
  HetHanLuc: string;
  CoMatLuc: string | null;
}
export interface PhienQuyetDinh extends AnhHuongSuCo {
  NguoiPhuTrach: { Id: string; HoTen: string }[];
  PhienId: string;
  HieuLuc: string;
  HetHanLuc: string;
  TrangThaiPhien: string;
  NoiDungConHieuLuc: boolean;
  GioMayChu: string;
  GiuCho: {
    TenTaiNguyen: string;
    TaiNguyenId: string;
    Loai: string;
    BatDau: string;
    KetThuc: string;
    HetHanLuc: string;
    TrangThai: string;
  }[];
  LoiMoi: LoiMoi[];
}
export interface LoiMoiCaNhan extends LoiMoi {
  NoiDung: {
    TenCa: string;
    TenDuAn: string;
    DiaDiem: string;
    BatDau: string;
    KetThuc: string;
  };
  GhiChuBanGiao: string;
  LichSu: { TrangThai: string; NgayTao: string }[];
}
export const DocPhien = async (Id: string) =>
  (await Api.get<PhienQuyetDinh | null>(`/phien-quyet-dinh/su-co/${Id}`)).data;
export const TaoPhien = async (Id: string, HieuLuc: string, TaoLai = false) =>
  (
    await Api.post<PhienQuyetDinh>(`/phien-quyet-dinh/su-co/${Id}`, {
      HieuLuc,
      TaoLai,
    })
  ).data;
export const GuiLoiMoi = async (
  Id: string,
  PhuongAnId: string,
  NguoiNhan: string[],
  GhiChuBanGiao: string,
) =>
  (
    await Api.post<PhienQuyetDinh>(`/phien-quyet-dinh/${Id}/loi-moi`, {
      PhuongAnId,
      NguoiNhan,
      GhiChuBanGiao,
    })
  ).data;
export const ChotPhuongAn = async (
  Id: string,
  PhuongAnId: string,
  NguoiPhuTrachId: string,
) =>
  (
    await Api.post(`/phien-quyet-dinh/${Id}/chot`, {
      PhuongAnId,
      NguoiPhuTrachId,
      XacNhanGiaoNhan: true,
    })
  ).data;
export const HuyPhien = async (Id: string) =>
  Api.post(`/phien-quyet-dinh/${Id}/huy`);
export const RutLoiMoi = async (Id: string) =>
  Api.post(`/phien-quyet-dinh/loi-moi/${Id}/rut`);
export const LayLoiMoi = async (Trang: number) =>
  (
    await Api.get<LoiMoiCaNhan[]>("/phien-quyet-dinh/loi-moi/cua-toi", {
      params: { Trang },
    })
  ).data;
export const TraLoiMoi = async (
  Id: string,
  TraLoi: "DA_DONG_Y" | "DA_TU_CHOI" | "RUT_DONG_Y",
  CoMatLuc?: string,
) => Api.post(`/phien-quyet-dinh/loi-moi/${Id}/tra-loi`, { TraLoi, CoMatLuc });

export const DocPhienCa = async (Id: string) =>
  (await Api.get<PhienQuyetDinh | null>(`/phien-quyet-dinh/ca-quay/${Id}`))
    .data;
export const TaoPhienCa = async (Id: string, TaoLai = false) =>
  (
    await Api.post<PhienQuyetDinh>(`/phien-quyet-dinh/ca-quay/${Id}`, {
      TaoLai,
    })
  ).data;
