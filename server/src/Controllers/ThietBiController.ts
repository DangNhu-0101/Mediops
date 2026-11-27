import { BanDoLoiThongKe } from "../Services/KyThongKeService.js";
import { TrangThaiThietBi } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import {
  CapNhatThietBi as CapNhatThietBiTrongHeThong,
  LayChiTietThietBi as LayChiTietThietBiTrongHeThong,
  LayDanhMucThietBi,
  LayDanhSachThietBi as LayDanhSachThietBiTrongHeThong,
  LayThietBiLuaChon,
  TraCuuThietBiTheoQR,
  TaoThietBi as TaoThietBiTrongHeThong,
  XoaThietBi as XoaThietBiTrongHeThong,
} from "../Services/ThietBiService.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import { TaiAnhLenCloudinary } from "../Services/TaiAnhService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import { SchemaLocKho } from "../Services/ThongKeKhoService.js";

export const DuLieuThietBiSchema = z.object({
  MaQR: z
    .string()
    .trim()
    .min(1, "Mã QR không được để trống")
    .max(100)
    .optional(),
  SoSeri: z.string().trim().min(1, "Số seri là bắt buộc").max(100),
  TenThietBi: z
    .string()
    .trim()
    .min(2, "Tên thiết bị phải có ít nhất 2 ký tự")
    .max(200),
  DanhMucId: z.string().uuid("Danh mục không hợp lệ"),
  ThongSoKyThuat: z.record(z.unknown()),
  TrangThai: z.nativeEnum(TrangThaiThietBi),
  HinhAnhUrl: z
    .string()
    .trim()
    .url("URL ảnh không hợp lệ")
    .regex(/^https?:\/\//i, "URL ảnh phải dùng giao thức HTTP hoặc HTTPS")
    .max(2000)
    .optional(),
  ViTriKho: z.string().trim().max(200).optional(),
  KhoId: z.string().uuid("Kho không hợp lệ").nullable().optional(),
  MauThietBiId: z
    .string()
    .uuid("Dòng tài nguyên không hợp lệ")
    .nullable()
    .optional(),
  ThoiGianKiemTraSauSuDungPhut: z.coerce
    .number()
    .int()
    .min(0, "Thời gian kiểm tra không được âm")
    .max(1440)
    .optional(),
});

function ChuyenDoiDuLieu(DuLieu: unknown) {
  if (typeof DuLieu !== "object" || DuLieu === null) return DuLieu;
  const BanSao = { ...(DuLieu as Record<string, unknown>) };
  if (typeof BanSao.ThongSoKyThuat === "string") {
    try {
      BanSao.ThongSoKyThuat = JSON.parse(BanSao.ThongSoKyThuat);
    } catch {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["ThongSoKyThuat"],
          message: "Thông số kỹ thuật phải là JSON hợp lệ",
        },
      ]);
    }
  }
  for (const Truong of ["MaQR", "HinhAnhUrl", "ViTriKho"] as const) {
    if (BanSao[Truong] === "") delete BanSao[Truong];
  }
  for (const Truong of ["KhoId", "MauThietBiId"] as const) {
    if (BanSao[Truong] === "") BanSao[Truong] = null;
  }
  return BanSao;
}

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

async function LayDuongDanAnh(YeuCau: YeuCauXacThuc) {
  return YeuCau.file ? TaiAnhLenCloudinary(YeuCau.file) : undefined;
}

export async function LayDanhSachThietBi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const TrangThai = YeuCau.query.TrangThai;
    return PhanHoi.json(
      await LayDanhSachThietBiTrongHeThong({
        DonViId: LayDonViId(YeuCau),
        Loc: SchemaLocKho.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
        TimKiem:
          typeof YeuCau.query.TimKiem === "string"
            ? YeuCau.query.TimKiem
            : undefined,
        DanhMucId:
          typeof YeuCau.query.DanhMucId === "string"
            ? YeuCau.query.DanhMucId
            : undefined,
        TrangThai:
          typeof TrangThai === "string" &&
          Object.values(TrangThaiThietBi).includes(
            TrangThai as TrangThaiThietBi,
          )
            ? (TrangThai as TrangThaiThietBi)
            : undefined,
        KhoId:
          typeof YeuCau.query.KhoId === "string"
            ? YeuCau.query.KhoId
            : undefined,
        ChuaGanKho: YeuCau.query.ChuaGanKho === "true",
      }),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayDanhMuc(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(await LayDanhMucThietBi(LayDonViId(YeuCau)));
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayDanhSachLuaChon(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(await LayThietBiLuaChon(LayDonViId(YeuCau)));
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TraCuuQR(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const MaQR = z
      .string()
      .trim()
      .min(1, "Mã QR không được để trống")
      .max(100, "Mã QR không hợp lệ")
      .parse(YeuCau.params.maQR);
    return PhanHoi.json(await TraCuuThietBiTheoQR(MaQR, LayDonViId(YeuCau)));
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayChiTietThietBi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayChiTietThietBiTrongHeThong(
        String(YeuCau.params.id),
        LayDonViId(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TaoThietBi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = DuLieuThietBiSchema.parse(ChuyenDoiDuLieu(YeuCau.body));
    return PhanHoi.status(201).json(
      await TaoThietBiTrongHeThong(
        DuLieu,
        LayDonViId(YeuCau),
        await LayDuongDanAnh(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatThietBi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = DuLieuThietBiSchema.parse(ChuyenDoiDuLieu(YeuCau.body));
    return PhanHoi.json(
      await CapNhatThietBiTrongHeThong(
        String(YeuCau.params.id),
        DuLieu,
        LayDonViId(YeuCau),
        await LayDuongDanAnh(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function XoaThietBi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    await XoaThietBiTrongHeThong(String(YeuCau.params.id), LayDonViId(YeuCau));
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
