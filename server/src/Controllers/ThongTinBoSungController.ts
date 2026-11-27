import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import {
  LayThongTinBoSung,
  LuuThongTinBoSung,
} from "../Services/ThongTinBoSungService.js";
import {
  LoiDuLieuKhongHopLe,
  LoiKhongTimThay,
} from "../Services/LoiNghiepVuService.js";

export async function ThongTinBoSung(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const Id = z
      .string()
      .uuid("Mã tài nguyên không hợp lệ")
      .parse(YeuCau.params.id);
    const Nhom = YeuCau.baseUrl.split("/").at(-1)?.toLowerCase() ?? "";
    const DonViId = LayDonViId(YeuCau);
    if (YeuCau.method === "GET")
      return PhanHoi.json(await LayThongTinBoSung(Nhom, Id, DonViId));
    const DuLieu = z
      .object({
        CacKhoangKhongKhaDung: z.unknown(),
        TrinhDo: z.unknown().optional(),
      })
      .strict("Dữ liệu chứa trường không được hỗ trợ")
      .parse(YeuCau.body);
    return PhanHoi.json(
      await LuuThongTinBoSung(Nhom, Id, DonViId, {
        CacKhoangKhongKhaDung: DuLieu.CacKhoangKhongKhaDung,
        TrinhDo: DuLieu.TrinhDo,
      }),
    );
  } catch (Loi) {
    if (Loi instanceof z.ZodError)
      return PhanHoi.status(400).json({
        ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ.",
      });
    if (Loi instanceof LoiDuLieuKhongHopLe)
      return PhanHoi.status(400).json({ ThongBao: Loi.message });
    if (Loi instanceof LoiKhongTimThay)
      return PhanHoi.status(404).json({ ThongBao: Loi.message });
    return TiepTheo(Loi);
  }
}
