import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  KiemTraDangNhap,
  LoiCauHinhHeThong,
  LayThongTinNguoiDung,
  LoiDonViKhongHoatDong,
  TaoToken,
} from "../Services/XacThucService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { MatKhauSchema } from "./HoSoController.js";
import { LoiCauHinhEmail } from "../Services/GuiEmailService.js";
import { LoiDuLieuKhongHopLe } from "../Services/LoiNghiepVuService.js";
import {
  DatLaiMatKhauBangLienKet,
  KiemTraLienKetDatLai,
  LoiGuiQuaNhanh,
  YeuCauDatLaiMatKhau,
} from "../Services/QuenMatKhauService.js";

const DuLieuDangNhapSchema = z
  .object({
    TenDangNhap: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email hoặc tên đăng nhập"),
    MatKhau: z.string().min(1, "Vui lòng nhập mật khẩu"),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

function PhanHoiLoiDuLieu(PhanHoi: Response, Loi: z.ZodError) {
  return PhanHoi.status(400).json({
    ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    Loi: Loi.flatten().fieldErrors,
  });
}

export async function DangKy(
  YeuCau: Request,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  return PhanHoi.status(403).json({
    ThongBao:
      "Đăng ký công khai đã được tắt. Vui lòng liên hệ quản lý đơn vị để được cấp tài khoản.",
  });
}

export async function DangNhap(
  YeuCau: Request,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  const KetQua = DuLieuDangNhapSchema.safeParse(YeuCau.body);
  if (!KetQua.success) {
    return PhanHoiLoiDuLieu(PhanHoi, KetQua.error);
  }

  try {
    const NguoiDung = await KiemTraDangNhap(
      KetQua.data.TenDangNhap,
      KetQua.data.MatKhau,
    );
    if (!NguoiDung) {
      return PhanHoi.status(401).json({
        ThongBao: "Thông tin đăng nhập không chính xác",
      });
    }

    const { PhienBanDangNhap, ...ThongTin } = NguoiDung;
    return PhanHoi.json({
      Token: await TaoToken(NguoiDung.Id, PhienBanDangNhap),
      NguoiDung: ThongTin,
    });
  } catch (Loi) {
    if (Loi instanceof LoiCauHinhHeThong)
      return PhanHoi.status(503).json({ ThongBao: Loi.message });
    if (Loi instanceof LoiDonViKhongHoatDong) {
      return PhanHoi.status(403).json({ ThongBao: Loi.message });
    }
    return TiepTheo(Loi);
  }
}

export async function LayThongTinCaNhan(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const NguoiDung = await LayThongTinNguoiDung(YeuCau.NguoiDung!.nguoiDungId);
    if (!NguoiDung) {
      return PhanHoi.status(401).json({
        ThongBao: "Tài khoản không còn tồn tại",
      });
    }
    return PhanHoi.json(NguoiDung);
  } catch (Loi) {
    return TiepTheo(Loi);
  }
}

const QuenMatKhauSchema = z
  .object({
    Email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email")
      .email("Email không đúng định dạng")
      .max(200, "Email không được quá 200 ký tự"),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

const TokenDatLaiSchema = z
  .string({ required_error: "Thiếu mã đặt lại mật khẩu" })
  .min(1, "Thiếu mã đặt lại mật khẩu")
  .max(2000, "Mã đặt lại mật khẩu không hợp lệ");

const DatLaiMatKhauQuaEmailSchema = z
  .object({
    Token: TokenDatLaiSchema,
    MatKhau: MatKhauSchema,
    XacNhanMatKhau: z.string(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ")
  .refine(
    (DuLieu) => DuLieu.MatKhau === DuLieu.XacNhanMatKhau,
    "Mật khẩu xác nhận không khớp.",
  );

function XuLyLoiQuenMatKhau(
  PhanHoi: Response,
  TiepTheo: NextFunction,
  Loi: unknown,
) {
  if (Loi instanceof LoiCauHinhEmail)
    return PhanHoi.status(503).json({ ThongBao: Loi.message });
  if (Loi instanceof LoiGuiQuaNhanh)
    return PhanHoi.status(429).json({ ThongBao: Loi.message });
  if (Loi instanceof LoiDuLieuKhongHopLe)
    return PhanHoi.status(400).json({ ThongBao: Loi.message });
  return TiepTheo(Loi);
}

export async function QuenMatKhau(
  YeuCau: Request,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  const KetQua = QuenMatKhauSchema.safeParse(YeuCau.body);
  if (!KetQua.success) return PhanHoiLoiDuLieu(PhanHoi, KetQua.error);
  try {
    await YeuCauDatLaiMatKhau(KetQua.data.Email);
    return PhanHoi.json({
      ThongBao:
        "Nếu email thuộc một tài khoản đang hoạt động, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (kể cả mục Thư rác).",
    });
  } catch (Loi) {
    return XuLyLoiQuenMatKhau(PhanHoi, TiepTheo, Loi);
  }
}

export async function KiemTraMaDatLai(
  YeuCau: Request,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  const KetQua = TokenDatLaiSchema.safeParse(YeuCau.query.Token);
  if (!KetQua.success) return PhanHoiLoiDuLieu(PhanHoi, KetQua.error);
  try {
    await KiemTraLienKetDatLai(KetQua.data);
    return PhanHoi.json({ HopLe: true });
  } catch (Loi) {
    return XuLyLoiQuenMatKhau(PhanHoi, TiepTheo, Loi);
  }
}

export async function DatLaiMatKhauQuaEmail(
  YeuCau: Request,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  const KetQua = DatLaiMatKhauQuaEmailSchema.safeParse(YeuCau.body);
  if (!KetQua.success) return PhanHoiLoiDuLieu(PhanHoi, KetQua.error);
  try {
    await DatLaiMatKhauBangLienKet(KetQua.data.Token, KetQua.data.MatKhau);
    return PhanHoi.json({
      ThongBao: "Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.",
    });
  } catch (Loi) {
    return XuLyLoiQuenMatKhau(PhanHoi, TiepTheo, Loi);
  }
}
