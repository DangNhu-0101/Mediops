import { Prisma, TrangThaiStudio } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import {
  CapNhatPhongStudio as CapNhatPhongStudioTrongHeThong,
  LayChiTietPhongStudio as LayChiTietPhongStudioTrongHeThong,
  LayDanhSachPhongStudio as LayDanhSachPhongStudioTrongHeThong,
  TaoPhongStudio as TaoPhongStudioTrongHeThong,
  XoaPhongStudio as XoaPhongStudioTrongHeThong,
} from "../Services/PhongStudioService.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
export const DuLieuPhongSchema = z
  .object({
    MaPhong: z.string().trim().min(1).max(50).optional(),
    TenPhong: z
      .string()
      .trim()
      .min(2, "Tên phòng quay phải có ít nhất 2 ký tự")
      .max(200),
    DiaDiem: z.string().trim().max(200).optional(),
    SucChua: z
      .number()
      .int()
      .positive("Sức chứa phải lớn hơn 0")
      .max(10000)
      .optional(),
    KhaNang: z
      .record(z.unknown())
      .optional()
      .transform((GiaTri) => GiaTri as Prisma.InputJsonValue | undefined),
    TrangThai: z.nativeEnum(TrangThaiStudio),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");
function XuLyLoi(P: Response, N: NextFunction, L: unknown) {
  if (L instanceof z.ZodError)
    return P.status(400).json({
      ThongBao: L.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    });
  if (L instanceof LoiKhongTimThay)
    return P.status(404).json({ ThongBao: L.message });
  if (L instanceof LoiXungDotDuLieu)
    return P.status(409).json({ ThongBao: L.message });
  return N(L);
}
export async function LayDanhSachPhongStudio(
  Y: YeuCauXacThuc,
  P: Response,
  N: NextFunction,
) {
  try {
    const T = Y.query.TrangThai;
    return P.json(
      await LayDanhSachPhongStudioTrongHeThong({
        DonViId: LayDonViId(Y),
        TimKiem:
          typeof Y.query.TimKiem === "string" ? Y.query.TimKiem : undefined,
        TrangThai:
          typeof T === "string" &&
          Object.values(TrangThaiStudio).includes(T as TrangThaiStudio)
            ? (T as TrangThaiStudio)
            : undefined,
      }),
    );
  } catch (L) {
    return XuLyLoi(P, N, L);
  }
}
export async function LayChiTietPhongStudio(
  Y: YeuCauXacThuc,
  P: Response,
  N: NextFunction,
) {
  try {
    return P.json(
      await LayChiTietPhongStudioTrongHeThong(
        String(Y.params.id),
        LayDonViId(Y),
      ),
    );
  } catch (L) {
    return XuLyLoi(P, N, L);
  }
}
export async function TaoPhongStudio(
  Y: YeuCauXacThuc,
  P: Response,
  N: NextFunction,
) {
  try {
    return P.status(201).json(
      await TaoPhongStudioTrongHeThong(
        DuLieuPhongSchema.parse(Y.body),
        LayDonViId(Y),
      ),
    );
  } catch (L) {
    return XuLyLoi(P, N, L);
  }
}
export async function CapNhatPhongStudio(
  Y: YeuCauXacThuc,
  P: Response,
  N: NextFunction,
) {
  try {
    return P.json(
      await CapNhatPhongStudioTrongHeThong(
        String(Y.params.id),
        DuLieuPhongSchema.parse(Y.body),
        LayDonViId(Y),
      ),
    );
  } catch (L) {
    return XuLyLoi(P, N, L);
  }
}
export async function XoaPhongStudio(
  Y: YeuCauXacThuc,
  P: Response,
  N: NextFunction,
) {
  try {
    await XoaPhongStudioTrongHeThong(String(Y.params.id), LayDonViId(Y));
    return P.status(204).send();
  } catch (L) {
    return XuLyLoi(P, N, L);
  }
}
