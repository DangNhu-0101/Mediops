import { Prisma } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";

export interface DuLieuKho {
  MaKho: string;
  TenKho: string;
  DiaChi: string;
  ViDo: number;
  KinhDo: number;
  BanKinhXacMinhMet: number;
  DangHoatDong: boolean;
}

const ChonKhoQuanLy = {
  Id: true,
  MaKho: true,
  TenKho: true,
  DiaChi: true,
  ViDo: true,
  KinhDo: true,
  BanKinhXacMinhMet: true,
  DangHoatDong: true,
  NgayCapNhat: true,
  _count: {
    select: {
      DanhSachThietBi: true,
      DanhSachGiaoDich: true,
      DanhSachNhatKyNguon: true,
      DanhSachSuCo: true,
    },
  },
} satisfies Prisma.KhoSelect;

function ChuyenKho(
  Kho: Prisma.KhoGetPayload<{ select: typeof ChonKhoQuanLy }>,
) {
  return {
    ...Kho,
    ViDo: Kho.ViDo.toNumber(),
    KinhDo: Kho.KinhDo.toNumber(),
  };
}

export async function LayDanhSachKhoQuanLy(ThamSo: {
  DonViId: string;
  TimKiem?: string;
  DangHoatDong?: boolean;
  Trang?: number;
  KichThuoc?: number;
}) {
  const DanhSach = await CoSoDuLieu.kho.findMany({
    where: {
      DonViId: ThamSo.DonViId,
      ...(ThamSo.TimKiem
        ? {
            OR: ["MaKho", "TenKho", "DiaChi"].map((Truong) => ({
              [Truong]: { contains: ThamSo.TimKiem, mode: "insensitive" },
            })),
          }
        : {}),
      ...(ThamSo.DangHoatDong === undefined
        ? {}
        : { DangHoatDong: ThamSo.DangHoatDong }),
    },
    select: ChonKhoQuanLy,
    ...(ThamSo.Trang
      ? {
          skip: (ThamSo.Trang - 1) * (ThamSo.KichThuoc ?? 12),
          take: ThamSo.KichThuoc ?? 12,
        }
      : {}),
    orderBy: { TenKho: "asc" },
  });
  return DanhSach.map(ChuyenKho);
}

export async function LayChiTietKho(Id: string, DonViId: string) {
  const Kho = await CoSoDuLieu.kho.findFirst({
    where: { Id: Id, DonViId: DonViId },
    select: ChonKhoQuanLy,
  });
  if (!Kho) throw new LoiKhongTimThay("Không tìm thấy kho");
  return ChuyenKho(Kho);
}

export function LayKhoLuaChonThietBi(DonViId: string) {
  return CoSoDuLieu.kho.findMany({
    where: { DonViId },
    select: {
      Id: true,
      MaKho: true,
      TenKho: true,
      DiaChi: true,
      BanKinhXacMinhMet: true,
      DangHoatDong: true,
    },
    orderBy: { TenKho: "asc" },
  });
}

export async function TaoKho(DuLieu: DuLieuKho, DonViId: string) {
  try {
    return ChuyenKho(
      await CoSoDuLieu.kho.create({
        data: { ...DuLieu, DonViId: DonViId },
        select: ChonKhoQuanLy,
      }),
    );
  } catch (Loi) {
    throw ChuyenLoiTrungLap(Loi);
  }
}

export async function CapNhatKho(
  Id: string,
  DuLieu: DuLieuKho,
  DonViId: string,
) {
  await LayChiTietKho(Id, DonViId);
  try {
    return ChuyenKho(
      await CoSoDuLieu.kho.update({
        where: { Id: Id },
        data: DuLieu,
        select: ChonKhoQuanLy,
      }),
    );
  } catch (Loi) {
    throw ChuyenLoiTrungLap(Loi);
  }
}

export async function CapNhatTrangThaiKho(
  Id: string,
  DangHoatDong: boolean,
  DonViId: string,
) {
  await LayChiTietKho(Id, DonViId);
  return ChuyenKho(
    await CoSoDuLieu.kho.update({
      where: { Id: Id },
      data: { DangHoatDong: DangHoatDong },
      select: ChonKhoQuanLy,
    }),
  );
}

export async function XoaKho(Id: string, DonViId: string) {
  const Kho = await LayChiTietKho(Id, DonViId);
  if (
    Kho._count.DanhSachThietBi > 0 ||
    Kho._count.DanhSachGiaoDich > 0 ||
    Kho._count.DanhSachNhatKyNguon > 0 ||
    Kho._count.DanhSachSuCo > 0
  ) {
    throw new LoiXungDotDuLieu(
      "Không thể xóa kho đang có thiết bị hoặc lịch sử liên quan. Hãy vô hiệu hóa kho.",
    );
  }
  await CoSoDuLieu.kho.delete({ where: { Id: Id } });
}

function ChuyenLoiTrungLap(Loi: unknown): unknown {
  if (
    Loi instanceof Prisma.PrismaClientKnownRequestError &&
    Loi.code === "P2002"
  ) {
    return new LoiXungDotDuLieu("Mã kho đã được sử dụng trong đơn vị");
  }
  return Loi;
}
