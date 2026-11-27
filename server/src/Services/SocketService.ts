import { ChonDuLieuQuyen, LayQuyenHieuLuc } from "./QuyenService.js";
import type { Server } from "socket.io";
import { CoSoDuLieu } from "../Config/Database.js";

let MayChuSocket: Server | undefined;

export function GanMayChuSocket(Io: Server) {
  MayChuSocket = Io;
}

export async function LayPhamViSocketHopLe(NguoiDungId: string) {
  const NguoiDung = await CoSoDuLieu.nguoiDung.findUnique({
    where: { Id: NguoiDungId },
    select: {
      ...ChonDuLieuQuyen,
      DonViId: true,
      LaQuanTriHeThong: true,
      DonVi: { select: { DangHoatDong: true } },
    },
  });
  if (
    !NguoiDung?.DonViId ||
    NguoiDung.LaQuanTriHeThong ||
    !NguoiDung.DonVi?.DangHoatDong
  ) {
    return null;
  }
  return {
    DonViId: NguoiDung.DonViId,
    Quyen: LayQuyenHieuLuc(NguoiDung),
  };
}

export async function NgatKetNoiDonVi(DonViId: string) {
  const DanhSachKetNoi = await MayChuSocket?.in(
    `don_vi_${DonViId}`,
  ).fetchSockets();
  DanhSachKetNoi?.forEach((KetNoi) => KetNoi.disconnect(true));
}

export async function PhatCapNhatLich(
  TenSuKien: string,
  DuLieu: unknown,
  CaQuayId?: string,
  DonViId?: string,
) {
  try {
    await PhatCapNhatLichNoiBo(TenSuKien, DuLieu, CaQuayId, DonViId);
  } catch (Loi) {
    console.error("Không thể phát sự kiện cập nhật sau khi lưu dữ liệu:", Loi);
  }
}

async function PhatCapNhatLichNoiBo(
  TenSuKien: string,
  DuLieu: unknown,
  CaQuayId?: string,
  DonViId?: string,
) {
  if (!MayChuSocket || !DonViId) return;

  const CacPhong = [`don_vi_${DonViId}`];
  if (CaQuayId) CacPhong.push(`ca_quay_${CaQuayId}`);
  const CacKetNoi = (
    await Promise.all(
      CacPhong.map((Phong) => MayChuSocket!.in(Phong).fetchSockets()),
    )
  ).flat();
  const CacKetNoiDuyNhat = new Map(
    CacKetNoi.map((KetNoi) => [KetNoi.id, KetNoi]),
  );
  const DanhSachNguoiDungId = [
    ...new Set(
      [...CacKetNoiDuyNhat.values()].flatMap((KetNoi) =>
        typeof KetNoi.data.NguoiDungId === "string"
          ? [KetNoi.data.NguoiDungId]
          : [],
      ),
    ),
  ];
  const DanhSachNguoiDungHopLe = await CoSoDuLieu.nguoiDung.findMany({
    where: {
      Id: { in: DanhSachNguoiDungId },
      DonViId: DonViId,
      LaQuanTriHeThong: false,
      DonVi: { DangHoatDong: true },
    },
    select: {
      ...ChonDuLieuQuyen,
      Id: true,
      PhienBanToken: true,
      CaQuayPhuTrach: { where: { Id: CaQuayId ?? "" }, select: { Id: true } },
      CaQuayThamGia: {
        where: { CaQuayId: CaQuayId ?? "" },
        select: { Id: true },
      },
    },
  });
  const CacNguoiDungHopLe = new Set(
    DanhSachNguoiDungHopLe.map((NguoiDung) => NguoiDung.Id),
  );

  [...CacKetNoiDuyNhat.values()].forEach((KetNoi) => {
    const NguoiDungId = KetNoi.data.NguoiDungId;
    if (
      typeof NguoiDungId !== "string" ||
      !CacNguoiDungHopLe.has(NguoiDungId)
    ) {
      KetNoi.disconnect(true);
      return;
    }
    const NguoiDung = DanhSachNguoiDungHopLe.find(
      (Nguoi) => Nguoi.Id === NguoiDungId,
    )!;
    if ((KetNoi.data.PhienBan ?? 0) !== NguoiDung.PhienBanToken) {
      KetNoi.disconnect(true);
      return;
    }
    const Quyen = LayQuyenHieuLuc(NguoiDung);
    const QuyenSuKien =
      TenSuKien.startsWith("bao_tri:") || TenSuKien.startsWith("su_co:")
        ? "SuCo.Xem"
        : "CaQuay.Xem";
    if (
      TenSuKien === "loi_moi:cap_nhat" ||
      (TenSuKien === "quyet_dinh:cap_nhat" &&
        (Quyen.includes("ThietBi.Xem") || Quyen.includes("Studio.Xem"))) ||
      Quyen.includes(QuyenSuKien) ||
      (CaQuayId &&
        (NguoiDung.CaQuayPhuTrach.length || NguoiDung.CaQuayThamGia.length))
    )
      KetNoi.emit(TenSuKien, DuLieu);
  });
}

export async function NgatKetNoiNguoiDung(Id: string) {
  try {
    const KetNoi = await MayChuSocket?.fetchSockets();
    KetNoi?.filter((Muc) => Muc.data.NguoiDungId === Id).forEach((Muc) =>
      Muc.disconnect(true),
    );
  } catch {
    console.error(
      "Không thể ngắt kết nối thời gian thực; phiên cũ đã bị thu hồi.",
    );
  }
}
