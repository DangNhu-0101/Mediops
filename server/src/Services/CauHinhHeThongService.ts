import { z } from "zod";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  CongCuLuuTruAnhCloudinary,
  KiemTraNoiDungAnh,
  type CongCuLuuTruAnh,
} from "./TaiAnhService.js";

const IdCauHinh = "MAC_DINH";
export const TenHeThongMacDinh = "MEDIOPS";

const ChuoiTuyChon = (DoDai: number) =>
  z.preprocess(
    (GiaTri) =>
      typeof GiaTri === "string" && GiaTri.trim() === "" ? null : GiaTri,
    z.string().trim().max(DoDai).nullable().optional(),
  );

export const CauHinhHeThongSchema = z
  .object({
    TenHeThong: z
      .string()
      .trim()
      .min(2, "Tên hệ thống phải có ít nhất 2 ký tự")
      .max(60, "Tên hệ thống không được quá 60 ký tự"),
    KhauHieu: ChuoiTuyChon(200),
    EmailHoTro: z.preprocess(
      (GiaTri) =>
        typeof GiaTri === "string" && GiaTri.trim() === "" ? null : GiaTri,
      z
        .string()
        .trim()
        .email("Email hỗ trợ không đúng định dạng")
        .nullable()
        .optional(),
    ),
    SoDienThoaiHoTro: z.preprocess(
      (GiaTri) =>
        typeof GiaTri === "string" && GiaTri.trim() === "" ? null : GiaTri,
      z
        .string()
        .trim()
        .regex(/^\+?[0-9]{9,15}$/, "Số điện thoại hỗ trợ không đúng định dạng")
        .nullable()
        .optional(),
    ),
    XoaLogo: z.preprocess(
      (GiaTri) => GiaTri === true || GiaTri === "true",
      z.boolean(),
    ),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

const CauHinhCongKhaiSelect = {
  TenHeThong: true,
  KhauHieu: true,
  EmailHoTro: true,
  SoDienThoaiHoTro: true,
  LogoUrl: true,
  NgayCapNhat: true,
} as const;

// Cấu hình công khai dùng cho trang đăng nhập, tiêu đề và biểu tượng website.
export async function LayCauHinhHeThong() {
  const CauHinh = await CoSoDuLieu.cauHinhHeThong.findUnique({
    where: { Id: IdCauHinh },
    select: CauHinhCongKhaiSelect,
  });
  return (
    CauHinh ?? {
      TenHeThong: TenHeThongMacDinh,
      KhauHieu: null,
      EmailHoTro: null,
      SoDienThoaiHoTro: null,
      LogoUrl: null,
      NgayCapNhat: null,
    }
  );
}

export async function CapNhatCauHinhHeThong(
  DauVao: unknown,
  TepLogo?: Express.Multer.File,
  CongCu: CongCuLuuTruAnh = CongCuLuuTruAnhCloudinary,
) {
  const { XoaLogo, ...DuLieu } = CauHinhHeThongSchema.parse(DauVao);
  if (TepLogo) KiemTraNoiDungAnh(TepLogo);
  const CauHinhCu = await CoSoDuLieu.cauHinhHeThong.findUnique({
    where: { Id: IdCauHinh },
    select: { LogoPublicId: true },
  });
  const LogoMoi = TepLogo
    ? await CongCu.TaiAnh(TepLogo, "mediops/he-thong")
    : null;
  const DoiLogo = Boolean(LogoMoi || XoaLogo);
  try {
    const DuLieuLogo = DoiLogo
      ? {
          LogoUrl: LogoMoi?.SecureUrl ?? null,
          LogoPublicId: LogoMoi?.PublicId ?? null,
        }
      : {};
    await CoSoDuLieu.cauHinhHeThong.upsert({
      where: { Id: IdCauHinh },
      create: { Id: IdCauHinh, ...DuLieu, ...DuLieuLogo },
      update: { ...DuLieu, ...DuLieuLogo },
    });
  } catch (Loi) {
    if (LogoMoi) await Promise.allSettled([CongCu.XoaAnh(LogoMoi.PublicId)]);
    throw Loi;
  }
  if (DoiLogo && CauHinhCu?.LogoPublicId)
    await Promise.allSettled([CongCu.XoaAnh(CauHinhCu.LogoPublicId)]);
  return LayCauHinhHeThong();
}
