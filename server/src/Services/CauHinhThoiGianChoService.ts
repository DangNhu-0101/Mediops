import { z } from "zod";
import { CoSoDuLieu } from "../Config/Database.js";
import type { NguoiDungXacThuc } from "../Types/index.js";
import { LoiVanHanhKho } from "./LoiNghiepVuService.js";
import { ThucHienGiaoDichLich } from "./GiaoDichLichService.js";
import type { Prisma } from "@prisma/client";

export const MacDinhCho = { THIET_BI: 10, STUDIO: 10, NHAN_SU: 30 };
export const CauHinhChoSchema = z
  .object({
    PhanHe: z.enum(["THIET_BI", "STUDIO", "NHAN_SU"]),
    SoPhut: z.number().int().min(1).max(120),
  })
  .strict();
export async function LayThoiGianCho(
  Db: Prisma.TransactionClient = CoSoDuLieu,
) {
  const KetQua = { ...MacDinhCho };
  for (const Muc of await Db.cauHinhThoiGianCho.findMany()) {
    const HopLe = CauHinhChoSchema.safeParse(Muc);
    if (HopLe.success) KetQua[HopLe.data.PhanHe] = HopLe.data.SoPhut;
  }
  return KetQua;
}
function KiemTraQuanTri(Nguoi: NguoiDungXacThuc) {
  if (!Nguoi.LaQuanTriHeThong || Nguoi.DonViId)
    throw new LoiVanHanhKho(
      "Chỉ quản trị toàn hệ thống được quản lý thời gian chờ.",
      403,
      "CAU_HINH_CHO",
    );
}
export async function DocCauHinhCho(Nguoi: NguoiDungXacThuc) {
  KiemTraQuanTri(Nguoi);
  return {
    GiaTri: await LayThoiGianCho(),
    LichSu: await CoSoDuLieu.nhatKyCauHinhCho.findMany({
      orderBy: { NgayTao: "desc" },
      take: 50,
    }),
  };
}
export async function SuaCauHinhCho(DauVao: unknown, Nguoi: NguoiDungXacThuc) {
  KiemTraQuanTri(Nguoi);
  const DuLieu = CauHinhChoSchema.parse(DauVao);
  return ThucHienGiaoDichLich(async (Db) => {
    const GiaTriCu = (await LayThoiGianCho(Db))[DuLieu.PhanHe];
    await Db.cauHinhThoiGianCho.upsert({
      where: { PhanHe: DuLieu.PhanHe },
      create: DuLieu,
      update: { SoPhut: DuLieu.SoPhut },
    });
    await Db.nhatKyCauHinhCho.create({
      data: {
        PhanHe: DuLieu.PhanHe,
        GiaTriCu,
        GiaTriMoi: DuLieu.SoPhut,
        NguoiSuaId: Nguoi.nguoiDungId,
      },
    });
    return LayThoiGianCho(Db);
  });
}
