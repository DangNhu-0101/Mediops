import type { Prisma } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  CacKhoangBanSchema,
  ThanhJson,
  TrinhDoSchema,
} from "./DuLieuNhungService.js";
import { LoiDuLieuKhongHopLe, LoiKhongTimThay } from "./LoiNghiepVuService.js";

export async function LayThongTinBoSung(
  Nhom: string,
  Id: string,
  DonViId: string,
  Db: Prisma.TransactionClient = CoSoDuLieu,
) {
  const DuLieu =
    Nhom === "thiet-bi"
      ? await Db.thietBi.findFirst({
          where: { Id, DanhMuc: { DonViId } },
          select: { CacKhoangKhongKhaDung: true },
        })
      : Nhom === "phong-studio"
        ? await Db.phongStudio.findFirst({
            where: { Id, DonViId },
            select: { CacKhoangKhongKhaDung: true },
          })
        : Nhom === "nhan-su"
          ? await Db.nguoiDung.findFirst({
              where: { Id, DonViId, LaQuanTriHeThong: false },
              select: { CacKhoangKhongKhaDung: true, TrinhDo: true },
            })
          : null;
  if (!DuLieu)
    throw new LoiKhongTimThay("Không tìm thấy tài nguyên thuộc đơn vị.");
  return DuLieu;
}
export async function LuuThongTinBoSung(
  Nhom: string,
  Id: string,
  DonViId: string,
  DuLieu: { CacKhoangKhongKhaDung: unknown; TrinhDo?: unknown },
) {
  const Khoang = CacKhoangBanSchema.parse(DuLieu.CacKhoangKhongKhaDung);
  return CoSoDuLieu.$transaction(
    async (Db) => {
      await LayThongTinBoSung(Nhom, Id, DonViId, Db);
      if (DuLieu.TrinhDo !== undefined && Nhom !== "nhan-su")
        throw new LoiDuLieuKhongHopLe("Chỉ nhân sự có thông tin trình độ.");
      const TrinhDo =
        DuLieu.TrinhDo !== undefined
          ? TrinhDoSchema.parse(DuLieu.TrinhDo)
          : undefined;
      const ThongTin = { CacKhoangKhongKhaDung: ThanhJson(Khoang) };
      if (Nhom === "thiet-bi")
        await Db.thietBi.updateMany({
          where: { Id, DanhMuc: { DonViId } },
          data: ThongTin,
        });
      else if (Nhom === "phong-studio")
        await Db.phongStudio.updateMany({
          where: { Id, DonViId },
          data: ThongTin,
        });
      else
        await Db.nguoiDung.updateMany({
          where: { Id, DonViId },
          data: {
            ...ThongTin,
            ...(TrinhDo !== undefined ? { TrinhDo } : {}),
          },
        });
      return LayThongTinBoSung(Nhom, Id, DonViId, Db);
    },
    { isolationLevel: "Serializable" },
  );
}
