import { Prisma } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";

export function LayDanhSachMau(DonViId: string) {
  return CoSoDuLieu.mauThietBi.findMany({
    where: { DanhMuc: { DonViId } },
    select: { Id: true, MaMau: true, TenMau: true, DanhMucId: true },
    orderBy: [{ TenMau: "asc" }, { Id: "asc" }],
  });
}
export async function LuuMau(
  DonViId: string,
  DuLieu: { MaMau: string; TenMau: string; DanhMucId: string },
  Id?: string,
) {
  try {
    return await CoSoDuLieu.$transaction(async (GiaoDich) => {
      // Khóa theo danh mục để hai yêu cầu đồng thời không tạo mã chỉ khác hoa/thường.
      await GiaoDich.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${DuLieu.DanhMucId}))::text`;
      const DanhMuc = await GiaoDich.danhMucThietBi.findFirst({
        where: { Id: DuLieu.DanhMucId, DonViId },
        select: { Id: true },
      });
      if (!DanhMuc)
        throw new LoiKhongTimThay("Không tìm thấy danh mục trong đơn vị.");
      if (Id) {
        const Mau = await GiaoDich.mauThietBi.findFirst({
          where: { Id, DanhMuc: { DonViId } },
          select: { DanhMucId: true },
        });
        if (!Mau) throw new LoiKhongTimThay("Không tìm thấy dòng tài nguyên.");
        if (Mau.DanhMucId !== DuLieu.DanhMucId)
          throw new LoiXungDotDuLieu(
            "Dòng tài nguyên đã có danh mục xác định. Hãy tạo dòng riêng khi đổi danh mục.",
          );
      }
      const DuLieuLuu = {
        ...DuLieu,
        MaMau: DuLieu.MaMau.trim(),
        TenMau: DuLieu.TenMau.trim(),
      };
      const TrungMa = await GiaoDich.mauThietBi.findFirst({
        where: {
          DanhMucId: DuLieu.DanhMucId,
          MaMau: { equals: DuLieuLuu.MaMau, mode: "insensitive" },
          ...(Id ? { Id: { not: Id } } : {}),
        },
        select: { Id: true },
      });
      if (TrungMa)
        throw new LoiXungDotDuLieu(
          "Mã dòng tài nguyên đã có trong danh mục này.",
        );
      return Id
        ? GiaoDich.mauThietBi.update({ where: { Id }, data: DuLieuLuu })
        : GiaoDich.mauThietBi.create({ data: DuLieuLuu });
    });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    )
      throw new LoiXungDotDuLieu(
        "Mã dòng tài nguyên đã có trong danh mục này.",
      );
    throw Loi;
  }
}
