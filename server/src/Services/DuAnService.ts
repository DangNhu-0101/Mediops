import { Prisma, type TrangThaiDuAn } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import {
  DieuKienCaDuocXem,
  LayChiTietDuAnThongKe,
  SchemaThongKeDuAn,
  type PhamViThongKe,
} from "./ThongKeDuAnService.js";

export interface DuLieuDuAn {
  MaDuAn?: string;
  TenDuAn: string;
  TenKhachHang?: string;
  MoTa?: string;
  TrangThai: TrangThaiDuAn;
  HanChot?: Date;
}

export async function LayDanhSachDuAn(ThamSo: {
  DonViId: string;
  TimKiem?: string;
  TrangThai?: TrangThaiDuAn;
  PhamVi?: PhamViThongKe;
  Trang?: number;
  KichThuoc?: number;
}) {
  const Where = {
    DonViId: ThamSo.DonViId,
    ...(ThamSo.TimKiem
      ? {
          OR: ["TenDuAn", "MaDuAn", "TenKhachHang"].map((Truong) => ({
            [Truong]: { contains: ThamSo.TimKiem, mode: "insensitive" },
          })),
        }
      : {}),
    ...(ThamSo.TrangThai ? { TrangThai: ThamSo.TrangThai } : {}),
  } satisfies Prisma.DuAnWhereInput;

  return CoSoDuLieu.duAn.findMany({
    where: Where,
    ...(ThamSo.Trang
      ? {
          skip: (ThamSo.Trang - 1) * (ThamSo.KichThuoc ?? 12),
          take: ThamSo.KichThuoc ?? 12,
        }
      : {}),
    select: {
      Id: true,
      MaDuAn: true,
      TenDuAn: true,
      TenKhachHang: true,
      MoTa: true,
      TrangThai: true,
      NgayTao: true,
      HanChot: true,
      _count: {
        select: {
          DanhSachCa: ThamSo.PhamVi
            ? { where: DieuKienCaDuocXem(ThamSo.DonViId, ThamSo.PhamVi) }
            : true,
        },
      },
    },
    orderBy: { NgayTao: "desc" },
  });
}

export async function LayChiTietDuAn(
  Id: string,
  DonViId: string,
  PhamVi: PhamViThongKe = { NguoiDungId: "", Quyen: [] },
) {
  return LayChiTietDuAnThongKe(
    Id,
    DonViId,
    SchemaThongKeDuAn.parse({}),
    PhamVi,
  );
}

export async function TaoDuAn(
  DuLieu: DuLieuDuAn,
  NguoiTaoId: string,
  DonViId: string,
) {
  try {
    return await CoSoDuLieu.duAn.create({
      data: { ...DuLieu, NguoiTaoId: NguoiTaoId, DonViId: DonViId },
    });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    ) {
      throw new LoiXungDotDuLieu("Mã dự án đã được sử dụng");
    }
    throw Loi;
  }
}

export async function CapNhatDuAn(
  Id: string,
  DuLieu: DuLieuDuAn,
  DonViId: string,
) {
  await KiemTraDuAnTonTai(Id, DonViId);
  try {
    return await CoSoDuLieu.duAn.update({ where: { Id: Id }, data: DuLieu });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    ) {
      throw new LoiXungDotDuLieu("Mã dự án đã được sử dụng");
    }
    throw Loi;
  }
}

export async function XoaDuAn(Id: string, DonViId: string) {
  const DuAn = await CoSoDuLieu.duAn.findFirst({
    where: { Id: Id, DonViId: DonViId },
    select: { Id: true, _count: { select: { DanhSachCa: true } } },
  });
  if (!DuAn) throw new LoiKhongTimThay("Không tìm thấy dự án");
  if (DuAn._count.DanhSachCa > 0) {
    throw new LoiXungDotDuLieu(
      "Không thể xóa dự án đang có ca quay liên quan. Có thể sửa trạng thái thành Đã hủy khi ngừng dự án; lịch sử vẫn được giữ",
    );
  }
  await CoSoDuLieu.duAn.delete({ where: { Id: Id } });
}

async function KiemTraDuAnTonTai(Id: string, DonViId: string) {
  const DuAn = await CoSoDuLieu.duAn.findFirst({
    where: { Id: Id, DonViId: DonViId },
    select: { Id: true },
  });
  if (!DuAn) throw new LoiKhongTimThay("Không tìm thấy dự án");
}
