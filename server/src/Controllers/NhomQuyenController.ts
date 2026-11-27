import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import { CacQuyenDuocCap } from "../Services/QuyenService.js";
import {
  CapNhatNhomQuyen as CapNhatNhomQuyenTrongHeThong,
  LayDanhSachNhomQuyen as LayDanhSachNhomQuyenTrongHeThong,
  TaoNhomQuyen as TaoNhomQuyenTrongHeThong,
  XoaNhomQuyen as XoaNhomQuyenTrongHeThong,
} from "../Services/NhomQuyenService.js";
import { XuLyLoiQuanTriDonVi } from "./ChucDanhController.js";

export const NhomQuyenSchema = z
  .object({
    TenNhom: z
      .string()
      .trim()
      .min(2, "Tên nhóm quyền phải có ít nhất 2 ký tự")
      .max(100, "Tên nhóm quyền không được quá 100 ký tự"),
    MoTa: z
      .string()
      .trim()
      .max(500, "Mô tả không được quá 500 ký tự")
      .nullable()
      .optional()
      .transform((GiaTri) => GiaTri || null),
    Quyen: z.array(
      z
        .string()
        .refine(
          (Quyen) => CacQuyenDuocCap.includes(Quyen),
          "Chức năng không được phép cấp.",
        ),
    ),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

export async function LayDanhSachNhomQuyen(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayDanhSachNhomQuyenTrongHeThong(
        LayDonViId(YeuCau),
        YeuCau.NguoiDung?.QuanTriDonVi === true,
      ),
    );
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TaoNhomQuyen(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.status(201).json(
      await TaoNhomQuyenTrongHeThong(
        LayDonViId(YeuCau),
        NhomQuyenSchema.parse(YeuCau.body),
      ),
    );
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatNhomQuyen(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await CapNhatNhomQuyenTrongHeThong(
        String(YeuCau.params.id),
        LayDonViId(YeuCau),
        NhomQuyenSchema.parse(YeuCau.body),
      ),
    );
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}

export async function XoaNhomQuyen(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    await XoaNhomQuyenTrongHeThong(
      String(YeuCau.params.id),
      LayDonViId(YeuCau),
    );
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoiQuanTriDonVi(PhanHoi, TiepTheo, Loi);
  }
}
