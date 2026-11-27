import { Prisma, type TrangThaiStudio } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";

export interface DuLieuPhongStudio {
  MaPhong?: string;
  TenPhong: string;
  DiaDiem?: string;
  SucChua?: number;
  KhaNang?: Prisma.InputJsonValue;
  TrangThai: TrangThaiStudio;
}
export async function LayDanhSachPhongStudio(ThamSo: {
  DonViId: string;
  TimKiem?: string;
  TrangThai?: TrangThaiStudio;
}) {
  return CoSoDuLieu.phongStudio.findMany({
    where: {
      DonViId: ThamSo.DonViId,
      ...(ThamSo.TimKiem
        ? {
            OR: ["TenPhong", "MaPhong", "DiaDiem"].map((Truong) => ({
              [Truong]: { contains: ThamSo.TimKiem, mode: "insensitive" },
            })),
          }
        : {}),
      ...(ThamSo.TrangThai ? { TrangThai: ThamSo.TrangThai } : {}),
    },
    select: {
      Id: true,
      MaPhong: true,
      TenPhong: true,
      DiaDiem: true,
      SucChua: true,
      KhaNang: true,
      TrangThai: true,
      _count: { select: { DanhSachCa: true } },
    },
    orderBy: { TenPhong: "asc" },
  });
}
export async function LayChiTietPhongStudio(Id: string, DonViId: string) {
  const Phong = await CoSoDuLieu.phongStudio.findFirst({
    where: { Id: Id, DonViId: DonViId },
    include: {
      DanhSachCa: {
        select: {
          Id: true,
          MaCaQuay: true,
          TieuDe: true,
          TrangThai: true,
          ThoiGianBatDau: true,
        },
        orderBy: { ThoiGianBatDau: "desc" },
      },
    },
  });
  if (!Phong) throw new LoiKhongTimThay("Không tìm thấy phòng quay");
  return Phong;
}
export async function TaoPhongStudio(
  DuLieu: DuLieuPhongStudio,
  DonViId: string,
) {
  try {
    return await CoSoDuLieu.phongStudio.create({
      data: { ...DuLieu, DonViId: DonViId },
    });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    )
      throw new LoiXungDotDuLieu("Mã phòng đã được sử dụng");
    throw Loi;
  }
}
export async function CapNhatPhongStudio(
  Id: string,
  DuLieu: DuLieuPhongStudio,
  DonViId: string,
) {
  const TonTai = await CoSoDuLieu.phongStudio.findFirst({
    where: { Id: Id, DonViId: DonViId },
    select: { Id: true },
  });
  if (!TonTai) throw new LoiKhongTimThay("Không tìm thấy phòng quay");
  try {
    return await CoSoDuLieu.phongStudio.update({
      where: { Id: Id },
      data: DuLieu,
    });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    )
      throw new LoiXungDotDuLieu("Mã phòng đã được sử dụng");
    throw Loi;
  }
}
export async function XoaPhongStudio(Id: string, DonViId: string) {
  const Phong = await CoSoDuLieu.phongStudio.findFirst({
    where: { Id: Id, DonViId: DonViId },
    select: { Id: true, _count: { select: { DanhSachCa: true } } },
  });
  if (!Phong) throw new LoiKhongTimThay("Không tìm thấy phòng quay");
  if (Phong._count.DanhSachCa > 0)
    throw new LoiXungDotDuLieu(
      "Không thể xóa phòng quay đang có ca quay liên quan",
    );
  await CoSoDuLieu.phongStudio.delete({ where: { Id: Id } });
}
