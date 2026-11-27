import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import {
  CapNhatCauHinhHeThong,
  LayCauHinhHeThong,
} from "../Services/CauHinhHeThongService.js";

export async function LayCauHinh(
  YeuCau: Request,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(await LayCauHinhHeThong());
  } catch (Loi) {
    return TiepTheo(Loi);
  }
}

export async function CapNhatCauHinh(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await CapNhatCauHinhHeThong(YeuCau.body, YeuCau.file ?? undefined),
    );
  } catch (Loi) {
    if (Loi instanceof z.ZodError)
      return PhanHoi.status(400).json({
        ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ.",
      });
    return TiepTheo(Loi);
  }
}
