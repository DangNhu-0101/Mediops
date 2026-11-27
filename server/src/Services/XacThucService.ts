import { Prisma, type NguoiDung } from "@prisma/client";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { LayQuyenHieuLuc } from "./QuyenService.js";
import { LayCauHinhHeThong } from "./CauHinhHeThongService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CoSoDuLieu } from "../Config/Database.js";

export const ThongTinNguoiDungSelect = {
  QuanTriDonVi: true,
  LaQuanTriHeThong: true,
  Id: true,
  TenDangNhap: true,
  HoTen: true,
  Email: true,
  SoDienThoai: true,
  AnhDaiDienUrl: true,
  GioiThieu: true,
  TrinhDo: true,
  CacKhoangKhongKhaDung: true,
  DonViId: true,
  NhomQuyenId: true,
  ChucDanhId: true,
  NhomQuyen: { select: { Id: true, TenNhom: true } },
  ChucDanh: { select: { Id: true, TenChucDanh: true } },
  DonVi: {
    select: { Id: true, MaDonVi: true, TenDonVi: true, DangHoatDong: true },
  },
  NgayTao: true,
} satisfies Prisma.NguoiDungSelect;

type ThongTinCoBan = Prisma.NguoiDungGetPayload<{
  select: typeof ThongTinNguoiDungSelect;
}>;

export type ThongTinNguoiDung = ThongTinCoBan & { Quyen: string[] };

export interface DuLieuDangKy {
  TenDangNhap: string;
  MatKhau: string;
  HoTen: string;
  Email: string;
  SoDienThoai: string;
}

export class LoiTrungTaiKhoan extends Error {}
export class LoiDonViKhongHoatDong extends Error {}

function LayKhoaBiMatJwt() {
  const KhoaBiMat = process.env.JWT_SECRET;
  if (!KhoaBiMat) {
    throw new Error("Máy chủ chưa cấu hình khóa ký JWT");
  }
  return KhoaBiMat;
}

export async function DangKyTaiKhoan(
  DuLieu: DuLieuDangKy,
): Promise<ThongTinNguoiDung> {
  throw new Error(
    "Đăng ký công khai đã được tắt. Vui lòng liên hệ quản lý đơn vị để được cấp tài khoản.",
  );
}

export async function KiemTraDangNhap(
  DinhDanh: string,
  MatKhau: string,
): Promise<(ThongTinNguoiDung & { PhienBanDangNhap?: number }) | null> {
  const TenHeThong = process.env.SYSTEM_ADMIN_USERNAME;
  if (TenHeThong && DinhDanh.toLowerCase() === TenHeThong.toLowerCase()) {
    const MatKhauHeThong = process.env.SYSTEM_ADMIN_PASSWORD;
    if (!MatKhauHeThong)
      throw new LoiCauHinhHeThong(
        "Máy chủ chưa cấu hình đầy đủ đăng nhập quản trị hệ thống.",
      );
    const Bam = (GiaTri: string) =>
      createHash("sha256").update(GiaTri).digest();
    return timingSafeEqual(Bam(MatKhau), Bam(MatKhauHeThong))
      ? await ThongTinQuanTriHeThong()
      : null;
  }
  const NguoiDung = await CoSoDuLieu.nguoiDung.findFirst({
    where: {
      OR: [
        { TenDangNhap: { equals: DinhDanh, mode: "insensitive" } },
        { Email: { equals: DinhDanh, mode: "insensitive" } },
      ],
    },
    include: {
      DonVi: {
        select: {
          Id: true,
          MaDonVi: true,
          TenDonVi: true,
          DangHoatDong: true,
        },
      },
    },
  });

  if (NguoiDung?.LaQuanTriHeThong) {
    throw new LoiCauHinhHeThong(
      "Tài khoản quản trị hệ thống chỉ đăng nhập bằng cấu hình máy chủ. Vui lòng cấu hình SYSTEM_ADMIN_USERNAME và SYSTEM_ADMIN_PASSWORD.",
    );
  }
  if (!NguoiDung || !(await bcrypt.compare(MatKhau, NguoiDung.MatKhauHash))) {
    return null;
  }

  if (!NguoiDung.DonViId || !NguoiDung.DonVi?.DangHoatDong) {
    throw new LoiDonViKhongHoatDong(
      NguoiDung.DonViId
        ? "Đơn vị đã bị vô hiệu hóa. Vui lòng liên hệ quản trị hệ thống."
        : "Tài khoản chưa được liên kết với đơn vị.",
    );
  }

  const ThongTin = await LayThongTinNguoiDung(NguoiDung.Id);
  return ThongTin
    ? { ...ThongTin, PhienBanDangNhap: NguoiDung.PhienBanToken }
    : null;
}

export const IdQuanTriHeThong = "quan-tri-he-thong-cau-hinh";
export class LoiCauHinhHeThong extends Error {}
// Tài khoản hệ thống hiển thị bằng tên và logo website thay cho chức danh.
async function ThongTinQuanTriHeThong(): Promise<ThongTinNguoiDung> {
  const CauHinh = await LayCauHinhHeThong();
  return {
    Id: IdQuanTriHeThong,
    HoTen: CauHinh.TenHeThong,
    TenDangNhap: "",
    Email: "",
    SoDienThoai: null,
    AnhDaiDienUrl: CauHinh.LogoUrl,
    GioiThieu: null,
    TrinhDo: null,
    CacKhoangKhongKhaDung: [],
    LaQuanTriHeThong: true,
    QuanTriDonVi: false,
    DonViId: null,
    NhomQuyenId: null,
    ChucDanhId: null,
    NhomQuyen: null,
    ChucDanh: null,
    DonVi: null,
    NgayTao: new Date(0),
    Quyen: [],
  };
}
function PhienBanHeThong() {
  if (!process.env.SYSTEM_ADMIN_USERNAME || !process.env.SYSTEM_ADMIN_PASSWORD)
    return null;
  return createHmac("sha256", LayKhoaBiMatJwt())
    .update(
      JSON.stringify([
        process.env.SYSTEM_ADMIN_USERNAME,
        process.env.SYSTEM_ADMIN_PASSWORD,
      ]),
    )
    .digest("hex");
}
export async function TaoToken(NguoiDungId: string, PhienBanDangNhap?: number) {
  const PhienBan =
    NguoiDungId === IdQuanTriHeThong
      ? PhienBanHeThong()
      : (PhienBanDangNhap ??
        (
          await CoSoDuLieu.nguoiDung.findUniqueOrThrow({
            where: { Id: NguoiDungId },
            select: { PhienBanToken: true },
          })
        ).PhienBanToken);
  return jwt.sign({ nguoiDungId: NguoiDungId, PhienBan }, LayKhoaBiMatJwt(), {
    expiresIn: "8h",
  });
}
export async function KiemTraPhien(NguoiDungId: string, PhienBan: unknown) {
  if (NguoiDungId === IdQuanTriHeThong)
    return !!PhienBanHeThong() && PhienBan === PhienBanHeThong();
  const NguoiDung = await CoSoDuLieu.nguoiDung.findUnique({
    where: { Id: NguoiDungId },
    select: { PhienBanToken: true, LaQuanTriHeThong: true },
  });
  return (
    !!NguoiDung &&
    !NguoiDung.LaQuanTriHeThong &&
    (PhienBan ?? 0) === NguoiDung.PhienBanToken
  );
}
export async function LayThongTinNguoiDung(
  NguoiDungId: string,
): Promise<ThongTinNguoiDung | null> {
  if (NguoiDungId === IdQuanTriHeThong)
    return PhienBanHeThong() ? await ThongTinQuanTriHeThong() : null;
  const KetQua = await CoSoDuLieu.nguoiDung.findUnique({
    where: { Id: NguoiDungId },
    select: {
      ...ThongTinNguoiDungSelect,
      NhomQuyen: { select: { Id: true, TenNhom: true, Quyen: true } },
    },
  });
  if (!KetQua || KetQua.LaQuanTriHeThong) return null;
  const { NhomQuyen, ...NguoiDung } = KetQua;
  return {
    ...NguoiDung,
    NhomQuyen: NhomQuyen
      ? { Id: NhomQuyen.Id, TenNhom: NhomQuyen.TenNhom }
      : null,
    Quyen: LayQuyenHieuLuc({
      QuanTriDonVi: NguoiDung.QuanTriDonVi,
      NhomQuyen,
    }),
  };
}
