import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import * as Phien from "../Services/PhienQuyetDinhService.js";
import { PhatCapNhatLich } from "../Services/SocketService.js";
import {
  LoiVanHanhKho,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";

const IdSchema = z.string().uuid();
const Ngay = z.string().datetime({ offset: true });
export function XuLyPhien(
  Loai:
    | "doc-ca"
    | "tao-ca"
    | "doc"
    | "tao"
    | "huy"
    | "moi"
    | "chot"
    | "cua-toi"
    | "tra-loi"
    | "rut",
) {
  return async (
    YeuCau: YeuCauXacThuc,
    PhanHoi: Response,
    TiepTheo: NextFunction,
  ) => {
    try {
      const PhamVi = { ...YeuCau.NguoiDung!, DonViId: LayDonViId(YeuCau) };
      const Id = Loai === "cua-toi" ? "" : IdSchema.parse(YeuCau.params.id);
      let KetQua: unknown;
      if (Loai === "doc-ca") KetQua = await Phien.DocPhienCaQuay(Id, PhamVi);
      if (Loai === "tao-ca") {
        const DuLieu = z
          .object({ TaoLai: z.boolean().default(false) })
          .strict()
          .parse(YeuCau.body);
        KetQua = await Phien.TaoPhienCaQuay(Id, DuLieu.TaoLai, PhamVi);
      }
      if (Loai === "doc") KetQua = await Phien.DocPhienSuCo(Id, PhamVi);
      if (Loai === "tao") {
        const DuLieu = z
          .object({ HieuLuc: Ngay, TaoLai: z.boolean().default(false) })
          .strict()
          .parse(YeuCau.body);
        KetQua = await Phien.TaoPhienSuCo(
          Id,
          new Date(DuLieu.HieuLuc),
          DuLieu.TaoLai,
          PhamVi,
        );
      }
      if (Loai === "huy") KetQua = await Phien.HuyPhien(Id, PhamVi);
      if (Loai === "moi") {
        const DuLieu = z
          .object({
            PhuongAnId: z.string().min(1),
            NguoiNhan: z.array(IdSchema).min(1).max(3),
            GhiChuBanGiao: z.string().trim().min(3).max(500),
          })
          .strict()
          .parse(YeuCau.body);
        KetQua = await Phien.GuiLoiMoi(
          Id,
          DuLieu.PhuongAnId,
          DuLieu.NguoiNhan,
          DuLieu.GhiChuBanGiao,
          PhamVi,
        );
      }
      if (Loai === "chot") {
        const DuLieu = z
          .object({
            PhuongAnId: z.string().min(1),
            NguoiPhuTrachId: IdSchema,
            XacNhanGiaoNhan: z.literal(true),
          })
          .strict()
          .parse(YeuCau.body);
        KetQua = await Phien.ChotPhuongAn(
          Id,
          DuLieu.PhuongAnId,
          DuLieu.NguoiPhuTrachId,
          DuLieu.XacNhanGiaoNhan,
          PhamVi,
        );
      }
      if (Loai === "cua-toi") {
        const DuLieu = z
          .object({
            Trang: z.coerce.number().int().min(1).max(10000).default(1),
          })
          .strict()
          .parse(YeuCau.query);
        KetQua = await Phien.LayLoiMoiCuaToi(PhamVi, DuLieu.Trang);
      }
      if (Loai === "tra-loi") {
        const DuLieu = z
          .object({
            TraLoi: z.enum(["DA_DONG_Y", "DA_TU_CHOI", "RUT_DONG_Y"]),
            CoMatLuc: Ngay.optional(),
          })
          .strict()
          .parse(YeuCau.body);
        await Phien.PhanHoiLoiMoi(
          Id,
          DuLieu.TraLoi,
          DuLieu.CoMatLuc ? new Date(DuLieu.CoMatLuc) : undefined,
          PhamVi,
        );
      }
      if (Loai === "rut") await Phien.RutLoiMoi(Id, PhamVi);
      if (!["doc", "doc-ca", "cua-toi"].includes(Loai)) {
        // Tín hiệu rỗng; người nhận tự tải lại API có kiểm quyền. Không phát tên ca/lý do riêng tư.
        await PhatCapNhatLich(
          "quyet_dinh:cap_nhat",
          {},
          undefined,
          PhamVi.DonViId,
        );
        await PhatCapNhatLich(
          "loi_moi:cap_nhat",
          {},
          undefined,
          PhamVi.DonViId,
        );
        if (Loai === "chot") {
          const BanGhi = await import("../Config/Database.js").then(
            ({ CoSoDuLieu }) =>
              CoSoDuLieu.phienQuyetDinh.findFirst({
                where: { Id, DonViId: PhamVi.DonViId },
                select: { CaQuayId: true },
              }),
          );
          if (BanGhi)
            await PhatCapNhatLich(
              "ca_quay:cap_nhat",
              { CaQuayId: BanGhi.CaQuayId },
              BanGhi.CaQuayId,
              PhamVi.DonViId,
            );
        }
      }
      return PhanHoi.json(KetQua === undefined ? { ThanhCong: true } : KetQua);
    } catch (Loi) {
      if (Loi instanceof z.ZodError)
        return PhanHoi.status(400).json({
          ThongBao:
            "Kiểm tra lựa chọn, ghi chú và thời gian. Không được tự đổi thời hạn chờ.",
        });
      if (Loi instanceof LoiVanHanhKho || Loi instanceof LoiXungDotDuLieu)
        return PhanHoi.status(
          Loi instanceof LoiVanHanhKho ? Loi.MaTrangThai : 409,
        ).json({ ThongBao: Loi.message });
      return TiepTheo(Loi);
    }
  };
}
