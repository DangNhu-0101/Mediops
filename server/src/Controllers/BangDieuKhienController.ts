import type { NextFunction, Response } from "express";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import { LayDuLieuBangDieuKhien } from "../Services/BangDieuKhienService.js";
import type { YeuCauXacThuc } from "../Types/index.js";

export async function LayBangDieuKhien(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayDuLieuBangDieuKhien({
        DonViId: LayDonViId(YeuCau),
        PhamVi: {
          NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
          Quyen: YeuCau.NguoiDung!.Quyen ?? [],
        },
      }),
    );
  } catch (Loi) {
    return TiepTheo(Loi);
  }
}
