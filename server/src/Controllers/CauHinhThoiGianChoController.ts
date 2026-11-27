import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import {
  DocCauHinhCho,
  SuaCauHinhCho,
} from "../Services/CauHinhThoiGianChoService.js";
import { LoiVanHanhKho } from "../Services/LoiNghiepVuService.js";

export async function XuLyCauHinhCho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      YeuCau.method === "GET"
        ? await DocCauHinhCho(YeuCau.NguoiDung!)
        : await SuaCauHinhCho(YeuCau.body, YeuCau.NguoiDung!),
    );
  } catch (Loi) {
    if (Loi instanceof z.ZodError)
      return PhanHoi.status(400).json({
        ThongBao: "Chọn phân hệ hợp lệ và số phút nguyên từ 1 đến 120.",
      });
    if (Loi instanceof LoiVanHanhKho)
      return PhanHoi.status(Loi.MaTrangThai).json({ ThongBao: Loi.message });
    return TiepTheo(Loi);
  }
}
