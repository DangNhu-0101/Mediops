import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import {
  CapNhatChucDanh as CapNhatChucDanhTrongHeThong,
  LayDanhSachChucDanh as LayDanhSachChucDanhTrongHeThong,
  TaoChucDanh as TaoChucDanhTrongHeThong,
  XoaChucDanh as XoaChucDanhTrongHeThong,
} from "../Services/ChucDanhService.js";

export const TenChucDanhSchema = z
  .string()
  .trim()
  .min(2, "Tên chức danh phải có ít nhất 2 ký tự")
  .max(100, "Tên chức danh không được quá 100 ký tự");

const CapNhatChucDanhSchema = z
  .object({
    TenChucDanh: TenChucDanhSchema.optional(),
    DangSuDung: z.boolean().optional(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

export function XuLyLoiQuanTriDonVi(
  PhanHoi: Response,
  TiepTheo: NextFunction,
  Loi: unknown,
) {
  if (Loi instanceof z.ZodError)
    return PhanHoi.status(400).json({
      ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ.",
    });
  if (Loi instanceof LoiKhongTimThay)
    return PhanHoi.status(404).json({ ThongBao: Loi.message });
  if (Loi instanceof LoiXungDotDuLieu)
    return PhanHoi.status(409).json({ ThongBao: Loi.message });
  return TiepTheo(Loi);
}

// Quản trị hệ thống làm việc trên danh mục dùng chung (DonViId null).
function LayPhamVi(YeuCau: YeuCauXacThuc) {
  return YeuCau.NguoiDung?.LaQuanTriHeThong ? null : LayDonViId(YeuCau);
}

export async function LayDanhSachChucDanh(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayDanhSachChucDanhTrongHeThong(LayPhamVi(YeuCau)),
    );
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TaoChucDanh(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = z
      .object({ TenChucDanh: TenChucDanhSchema })
      .strict("Dữ liệu chứa trường không được hỗ trợ")
      .parse(YeuCau.body);
    return PhanHoi.status(201).json(
      await TaoChucDanhTrongHeThong(LayPhamVi(YeuCau), DuLieu.TenChucDanh),
    );
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatChucDanh(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await CapNhatChucDanhTrongHeThong(
        String(YeuCau.params.id),
        LayPhamVi(YeuCau),
        CapNhatChucDanhSchema.parse(YeuCau.body),
      ),
    );
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}

export async function XoaChucDanh(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    await XoaChucDanhTrongHeThong(String(YeuCau.params.id), LayPhamVi(YeuCau));
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}
