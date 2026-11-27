import { BanDoLoiThongKe } from "../Services/KyThongKeService.js";
import { TrangThaiDuAn } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import {
  CapNhatDuAn as CapNhatDuAnTrongHeThong,
  LayDanhSachDuAn as LayDanhSachDuAnTrongHeThong,
  TaoDuAn as TaoDuAnTrongHeThong,
  XoaDuAn as XoaDuAnTrongHeThong,
} from "../Services/DuAnService.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import {
  LayChiTietDuAnThongKe,
  LayTongQuanDuAn,
  LayTomTatDuAn,
  SchemaThongKeDuAn,
} from "../Services/ThongKeDuAnService.js";

export const DuLieuDuAnSchema = z
  .object({
    MaDuAn: z.string().trim().min(1).max(50).optional(),
    TenDuAn: z
      .string()
      .trim()
      .min(2, "Tên dự án phải có ít nhất 2 ký tự")
      .max(200),
    TenKhachHang: z.string().trim().max(200).optional(),
    MoTa: z.string().trim().max(2000).optional(),
    TrangThai: z.nativeEnum(TrangThaiDuAn),
    HanChot: z.coerce.date().optional(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

function XuLyLoi(PhanHoi: Response, TiepTheo: NextFunction, Loi: unknown) {
  if (Loi instanceof z.ZodError)
    return PhanHoi.status(400).json({
      ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    });
  if (Loi instanceof LoiKhongTimThay)
    return PhanHoi.status(404).json({ ThongBao: Loi.message });
  if (Loi instanceof LoiXungDotDuLieu)
    return PhanHoi.status(409).json({ ThongBao: Loi.message });
  return TiepTheo(Loi);
}

export async function LayDanhSachDuAn(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const TrangThai = YeuCau.query.TrangThai;
    return PhanHoi.json(
      await LayDanhSachDuAnTrongHeThong({
        DonViId: LayDonViId(YeuCau),
        ...(YeuCau.query.Trang
          ? {
              Trang: SchemaThongKeDuAn.parse(YeuCau.query).Trang,
              KichThuoc: SchemaThongKeDuAn.parse(YeuCau.query).KichThuoc,
            }
          : {}),
        PhamVi: {
          NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
          Quyen: YeuCau.NguoiDung!.Quyen ?? [],
        },
        TimKiem:
          typeof YeuCau.query.TimKiem === "string"
            ? YeuCau.query.TimKiem
            : undefined,
        TrangThai:
          typeof TrangThai === "string" &&
          Object.values(TrangThaiDuAn).includes(TrangThai as TrangThaiDuAn)
            ? (TrangThai as TrangThaiDuAn)
            : undefined,
      }),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayChiTietDuAn(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayChiTietDuAnThongKe(
        String(YeuCau.params.id),
        LayDonViId(YeuCau),
        SchemaThongKeDuAn.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
        {
          NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
          Quyen: YeuCau.NguoiDung!.Quyen ?? [],
        },
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TongQuanDuAn(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    if (YeuCau.query.ChiSoCoBan === "true")
      return PhanHoi.json(
        await LayTomTatDuAn(
          LayDonViId(YeuCau),
          SchemaThongKeDuAn.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
        ),
      );
    return PhanHoi.json(
      await LayTongQuanDuAn(
        LayDonViId(YeuCau),
        SchemaThongKeDuAn.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
        {
          NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
          Quyen: YeuCau.NguoiDung!.Quyen ?? [],
        },
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TaoDuAn(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.status(201).json(
      await TaoDuAnTrongHeThong(
        DuLieuDuAnSchema.parse(YeuCau.body),
        YeuCau.NguoiDung!.nguoiDungId,
        LayDonViId(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatDuAn(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await CapNhatDuAnTrongHeThong(
        String(YeuCau.params.id),
        DuLieuDuAnSchema.parse(YeuCau.body),
        LayDonViId(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function XoaDuAn(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    await XoaDuAnTrongHeThong(String(YeuCau.params.id), LayDonViId(YeuCau));
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
