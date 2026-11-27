import { MatKhauSchema } from "./HoSoController.js";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import {
  CapNhatNhanSu as CapNhatNhanSuTrongHeThong,
  LayChiTietNhanSu as LayChiTietNhanSuTrongHeThong,
  LayDanhSachNhanSu as LayDanhSachNhanSuTrongHeThong,
  TaoNhanSu as TaoNhanSuTrongHeThong,
  XoaNhanSu as XoaNhanSuTrongHeThong,
} from "../Services/NhanSuService.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";

// Mã nhóm quyền/chức danh để trống được hiểu là không gán; dịch vụ kiểm tra khi nào bắt buộc.
const MaTuyChon = z.preprocess(
  (GiaTri) =>
    GiaTri === undefined || (typeof GiaTri === "string" && !GiaTri.trim())
      ? null
      : GiaTri,
  z.string().trim().min(1).nullable(),
);

export const DuLieuNhanSuSchema = z
  .object({
    TenDangNhap: z
      .string()
      .trim()
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
      .max(50)
      .regex(
        /^[A-Za-z0-9._-]+$/,
        "Tên đăng nhập chỉ gồm chữ cái, chữ số, dấu chấm, gạch ngang hoặc gạch dưới",
      ),
    HoTen: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự")
      .max(200),
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
    QuanTriDonVi: z.boolean().optional(),
    NhomQuyenId: MaTuyChon,
    ChucDanhId: MaTuyChon,
    MatKhau: MatKhauSchema.optional(),
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
export async function LayDanhSachNhanSu(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const { TimKiem, NhomQuyenId, ChucDanhId } = YeuCau.query;
    return PhanHoi.json(
      await LayDanhSachNhanSuTrongHeThong({
        DonViId: LayDonViId(YeuCau),
        TimKiem: typeof TimKiem === "string" ? TimKiem : undefined,
        NhomQuyenId: typeof NhomQuyenId === "string" ? NhomQuyenId : undefined,
        ChucDanhId: typeof ChucDanhId === "string" ? ChucDanhId : undefined,
      }),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
export async function LayChiTietNhanSu(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayChiTietNhanSuTrongHeThong(
        String(YeuCau.params.id),
        LayDonViId(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
export async function TaoNhanSu(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = DuLieuNhanSuSchema.parse(YeuCau.body);
    if (!DuLieu.MatKhau)
      return PhanHoi.status(400).json({
        ThongBao: "Vui lòng nhập mật khẩu cho nhân sự mới",
      });
    return PhanHoi.status(201).json(
      await TaoNhanSuTrongHeThong(
        DuLieu,
        LayDonViId(YeuCau),
        YeuCau.NguoiDung?.QuanTriDonVi === true,
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
export async function CapNhatNhanSu(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await CapNhatNhanSuTrongHeThong(
        String(YeuCau.params.id),
        DuLieuNhanSuSchema.omit({ MatKhau: true }).parse(YeuCau.body),
        LayDonViId(YeuCau),
        YeuCau.NguoiDung?.QuanTriDonVi === true,
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
export async function XoaNhanSu(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    await XoaNhanSuTrongHeThong(
      String(YeuCau.params.id),
      YeuCau.NguoiDung!.nguoiDungId,
      LayDonViId(YeuCau),
      YeuCau.NguoiDung?.QuanTriDonVi === true,
    );
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
