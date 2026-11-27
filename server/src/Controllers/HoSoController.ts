import {
  CacKhoangBanSchema,
  ThanhJson,
} from "../Services/DuLieuNhungService.js";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import * as HoSo from "../Services/HoSoService.js";
import {
  LoiKhongTimThay,
  LoiDuLieuKhongHopLe,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import { LayChucDanhPhanCong as LayChucDanhTrongHeThong } from "../Services/PhanCongChucVuService.js";

export const MatKhauSchema = z
  .string()
  .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
  .max(72, "Mật khẩu không được quá 72 ký tự")
  .refine(
    (GiaTri) => Buffer.byteLength(GiaTri, "utf8") <= 72,
    "Mật khẩu không được quá 72 byte",
  );
const JsonBieuMau = (GiaTri: unknown) => {
  if (typeof GiaTri !== "string") return GiaTri;
  try {
    return JSON.parse(GiaTri);
  } catch {
    return null;
  }
};
export const HoSoSchema = z
  .object({
    CacKhoangKhongKhaDung: z
      .preprocess(JsonBieuMau, CacKhoangBanSchema.transform(ThanhJson))
      .optional(),
    TenDangNhap: z
      .string()
      .trim()
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
      .max(100, "Tên đăng nhập không được quá 100 ký tự")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Tên đăng nhập chỉ gồm chữ cái, chữ số, dấu chấm, gạch ngang hoặc gạch dưới",
      )
      .optional(),
    GioiThieu: z
      .string()
      .trim()
      .max(500, "Giới thiệu không được quá 500 ký tự")
      .nullable()
      .optional(),
    XoaAnh: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((GiaTri) => GiaTri === true || GiaTri === "true")
      .optional(),
    HoTen: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự")
      .max(200, "Họ tên không được quá 200 ký tự"),
    Email: z
      .string()
      .trim()
      .email("Email không đúng định dạng")
      .transform((GiaTri) => GiaTri.toLowerCase()),
    SoDienThoai: z
      .string({ required_error: "Vui lòng nhập số điện thoại" })
      .trim()
      .min(1, "Vui lòng nhập số điện thoại")
      .regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không đúng định dạng"),
  })
  .strict("Không được sửa thông tin quản trị trong hồ sơ cá nhân.");
export const DatLaiMatKhauSchema = z
  .object({ MatKhau: MatKhauSchema, XacNhanMatKhau: z.string() })
  .strict("Dữ liệu chứa trường không được hỗ trợ.")
  .refine(
    (DuLieu) => DuLieu.MatKhau === DuLieu.XacNhanMatKhau,
    "Mật khẩu xác nhận không khớp.",
  );

function XuLyLoi(PhanHoi: Response, TiepTheo: NextFunction, Loi: unknown) {
  if (Loi instanceof LoiDuLieuKhongHopLe)
    return PhanHoi.status(400).json({ ThongBao: Loi.message });
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
export async function CapNhatHoSo(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  if (!YeuCau.NguoiDung?.DonViId || YeuCau.NguoiDung.LaQuanTriHeThong)
    return PhanHoi.status(403).json({
      ThongBao: "Thông tin quản trị hệ thống chỉ được cấu hình tại máy chủ.",
    });
  try {
    return PhanHoi.json(
      await HoSo.CapNhatHoSo(
        YeuCau.NguoiDung.nguoiDungId,
        LayDonViId(YeuCau),
        HoSoSchema.parse(YeuCau.body),
        YeuCau.file,
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
export const DoiMatKhauSchema = z
  .object({
    MatKhauHienTai: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu hiện tại")
      .max(72, "Mật khẩu hiện tại không được quá 72 ký tự"),
    MatKhauMoi: MatKhauSchema,
    XacNhanMatKhau: z.string(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ.")
  .refine(
    (DuLieu) => DuLieu.MatKhauMoi === DuLieu.XacNhanMatKhau,
    "Mật khẩu xác nhận không khớp.",
  );

export async function DoiMatKhauCaNhan(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  if (!YeuCau.NguoiDung?.DonViId || YeuCau.NguoiDung.LaQuanTriHeThong)
    return PhanHoi.status(403).json({
      ThongBao: "Thông tin quản trị hệ thống chỉ được cấu hình tại máy chủ.",
    });
  try {
    const DuLieu = DoiMatKhauSchema.parse(YeuCau.body);
    await HoSo.DoiMatKhauCaNhan(
      YeuCau.NguoiDung.nguoiDungId,
      LayDonViId(YeuCau),
      DuLieu.MatKhauHienTai,
      DuLieu.MatKhauMoi,
    );
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
export async function DatLaiMatKhau(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = DatLaiMatKhauSchema.parse(YeuCau.body);
    await HoSo.DatLaiMatKhau(
      String(YeuCau.params.id),
      LayDonViId(YeuCau),
      DuLieu.MatKhau,
      YeuCau.NguoiDung?.QuanTriDonVi === true,
    );
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
export async function LayNhanSuPhanCong(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(await HoSo.LayNhanSuPhanCong(LayDonViId(YeuCau)));
  } catch (Loi) {
    return TiepTheo(Loi);
  }
}
export async function LayChucDanhPhanCong(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(await LayChucDanhTrongHeThong(LayDonViId(YeuCau)));
  } catch (Loi) {
    return TiepTheo(Loi);
  }
}
