import type { NextFunction, Response } from "express";
import { z } from "zod";
import {
  CapNhatDonVi as CapNhatDonViTrongHeThong,
  LayDanhSachDonVi as LayDanhSachDonViTrongHeThong,
  TaoDonViVaQuanLyDauTien,
} from "../Services/DonViService.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { NgatKetNoiDonVi } from "../Services/SocketService.js";

const SoDienThoaiSchema = z.preprocess(
  (GiaTri) => (GiaTri === "" ? undefined : GiaTri),
  z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không đúng định dạng")
    .optional(),
);

const DuLieuDonViSchema = z.object({
  MaDonVi: z
    .string()
    .trim()
    .min(2, "Mã đơn vị phải có ít nhất 2 ký tự")
    .max(50)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Mã đơn vị chỉ gồm chữ, số, gạch ngang và gạch dưới",
    )
    .transform((GiaTri) => GiaTri.toUpperCase()),
  TenDonVi: z.string().trim().min(2).max(200),
  Email: z.preprocess(
    (GiaTri) => (GiaTri === "" ? undefined : GiaTri),
    z.string().trim().email("Email không đúng định dạng").optional(),
  ),
  SoDienThoai: SoDienThoaiSchema,
  DiaChi: z.preprocess(
    (GiaTri) => (GiaTri === "" ? undefined : GiaTri),
    z.string().trim().max(500).optional(),
  ),
  DangHoatDong: z.boolean().optional(),
});

const DuLieuTaoDonViSchema = z
  .object({
    DonVi: DuLieuDonViSchema.omit({ DangHoatDong: true }),
    QuanLy: z.object({
      TenDangNhap: z.string().trim().min(3).max(50),
      MatKhau: z.string().min(6).max(72),
      HoTen: z.string().trim().min(2).max(200),
      Email: z.string().trim().email("Email quản lý không đúng định dạng"),
      SoDienThoai: z
        .string({ required_error: "Vui lòng nhập số điện thoại quản lý" })
        .trim()
        .min(1, "Vui lòng nhập số điện thoại quản lý")
        .regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không đúng định dạng"),
    }),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

function XuLyLoi(PhanHoi: Response, TiepTheo: NextFunction, Loi: unknown) {
  if (Loi instanceof z.ZodError) {
    return PhanHoi.status(400).json({
      ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    });
  }
  if (Loi instanceof LoiKhongTimThay) {
    return PhanHoi.status(404).json({ ThongBao: Loi.message });
  }
  if (Loi instanceof LoiXungDotDuLieu) {
    return PhanHoi.status(409).json({ ThongBao: Loi.message });
  }
  return TiepTheo(Loi);
}

export async function LayDanhSachDonVi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(await LayDanhSachDonViTrongHeThong());
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TaoDonVi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = DuLieuTaoDonViSchema.parse(YeuCau.body);
    return PhanHoi.status(201).json(
      await TaoDonViVaQuanLyDauTien(DuLieu.DonVi, DuLieu.QuanLy),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatDonVi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = DuLieuDonViSchema.parse(YeuCau.body);
    const DonVi = await CapNhatDonViTrongHeThong(
      String(YeuCau.params.id),
      DuLieu,
    );
    if (!DonVi.DangHoatDong) await NgatKetNoiDonVi(DonVi.Id);
    return PhanHoi.json(DonVi);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
