import { Prisma } from "@prisma/client";
import { z } from "zod";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import { LayTrangThaiThietBi } from "./TrangThaiHienThiThietBiService.js";
import {
  LayKyThongKe,
  SchemaKyThongKe,
  BanDoLoiThongKe,
} from "./KyThongKeService.js";

export const SchemaQuanLyDanhMuc = z.object({
  TimKiem: z.string().trim().max(200).default(""),
  DanhMucId: z.string().uuid().optional(),
  KhoId: z.string().max(100).optional(),
  TrangThaiHienThi: z
    .enum(["RANH", "CHO_SU_DUNG", "DANG_SU_DUNG", "BAO_TRI", "NGOAI_LE"])
    .optional(),
  Trang: z.coerce.number().int().min(1).max(100000).default(1),
  KichThuoc: z.coerce.number().int().min(1).max(50).default(12),
});
export const SchemaDanhMuc = z
  .object({
    MaDanhMuc: z.string().trim().min(1, "Vui lòng nhập mã danh mục.").max(100),
    TenDanhMuc: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên danh mục.")
      .max(200),
    MoTa: z.string().trim().max(1000).default(""),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ.");
export async function QuanLyDanhMuc(
  DonViId: string,
  TruyVan: unknown,
  LaModel: boolean,
) {
  const Loc = SchemaQuanLyDanhMuc.parse(TruyVan, { errorMap: BanDoLoiThongKe });
  const PhanTrang = {
    skip: (Loc.Trang - 1) * Loc.KichThuoc,
    take: Loc.KichThuoc,
  };
  if (LaModel) {
    const TatCaMay = await LayTrangThaiThietBi(
      DonViId,
      LayKyThongKe(SchemaKyThongKe.parse({})),
    );
    const May = TatCaMay.filter(
      (Muc) =>
        (!Loc.KhoId ||
          (Loc.KhoId === "CHUA_GAN" ? !Muc.KhoId : Muc.KhoId === Loc.KhoId)) &&
        (!Loc.TrangThaiHienThi ||
          (Loc.TrangThaiHienThi === "NGOAI_LE"
            ? Muc.CoNgoaiLe
            : Muc.TrangThaiHienThi === Loc.TrangThaiHienThi)),
    );

    const Where: Prisma.MauThietBiWhereInput = {
      DanhMuc: { DonViId },
      ...(Loc.TrangThaiHienThi
        ? {
            Id: {
              in: May.flatMap((Muc) =>
                Muc.MauThietBiId ? [Muc.MauThietBiId] : [],
              ),
            },
          }
        : {}),
      ...(Loc.KhoId
        ? {
            DanhSachThietBi: {
              some: { KhoId: Loc.KhoId === "CHUA_GAN" ? null : Loc.KhoId },
            },
          }
        : {}),
      ...(Loc.DanhMucId ? { DanhMucId: Loc.DanhMucId } : {}),
      OR: [
        { TenMau: { contains: Loc.TimKiem, mode: "insensitive" } },
        { MaMau: { contains: Loc.TimKiem, mode: "insensitive" } },
      ],
    };
    const [DanhSach, TongSo] = await Promise.all([
      CoSoDuLieu.mauThietBi.findMany({
        where: Where,
        ...PhanTrang,
        include: {
          DanhMuc: { select: { TenDanhMuc: true } },
          _count: { select: { DanhSachThietBi: true } },
        },
        orderBy: [{ TenMau: "asc" }, { Id: "asc" }],
      }),
      CoSoDuLieu.mauThietBi.count({ where: Where }),
    ]);
    const CacHang = DanhSach.length
      ? await CoSoDuLieu.$queryRaw<
          Array<{ MauId: string; Hang: string | null }>
        >(
          Prisma.sql`SELECT DISTINCT "mauThietBiId" AS "MauId", "thongSoKyThuat"->>'thuongHieu' AS "Hang" FROM thiet_bi WHERE "mauThietBiId" IN (${Prisma.join(DanhSach.map((Muc) => Muc.Id))})`,
        )
      : [];
    return {
      DanhSach: DanhSach.map((Mau) => {
        const CacMay = May.filter(
          (Muc) =>
            Muc.MauThietBiId === Mau.Id &&
            (!Loc.KhoId ||
              (Loc.KhoId === "CHUA_GAN"
                ? !Muc.KhoId
                : Muc.KhoId === Loc.KhoId)),
        );
        const Hang = [
          ...new Set(
            CacHang.filter((Muc) => Muc.MauId === Mau.Id && Muc.Hang).map(
              (Muc) => Muc.Hang,
            ),
          ),
        ];
        return {
          ...Mau,
          Hang: Hang.length === 1 ? Hang[0] : null,
          ThongKe: {
            TongSo: CacMay.length,
            HienCo: CacMay.filter((Muc) => Muc.HienCo).length,
            DangSuDung: CacMay.filter(
              (Muc) => Muc.TrangThaiHienThi === "DANG_SU_DUNG",
            ).length,
            BaoTri: CacMay.filter((Muc) => Muc.TrangThaiHienThi === "BAO_TRI")
              .length,
          },
        };
      }),
      TongSo,
      Trang: Loc.Trang,
      KichThuoc: Loc.KichThuoc,
    };
  }
  const Where: Prisma.DanhMucThietBiWhereInput = {
    DonViId,
    OR: [
      { TenDanhMuc: { contains: Loc.TimKiem, mode: "insensitive" } },
      { MaDanhMuc: { contains: Loc.TimKiem, mode: "insensitive" } },
    ],
  };
  const [DanhSach, TongSo] = await Promise.all([
    CoSoDuLieu.danhMucThietBi.findMany({
      where: Where,
      ...PhanTrang,
      include: {
        _count: { select: { DanhSachMau: true, DanhSachThietBi: true } },
      },
      orderBy: [{ TenDanhMuc: "asc" }, { Id: "asc" }],
    }),
    CoSoDuLieu.danhMucThietBi.count({ where: Where }),
  ]);
  return { DanhSach, TongSo, Trang: Loc.Trang, KichThuoc: Loc.KichThuoc };
}
export async function LuuDanhMuc(
  DonViId: string,
  DuLieuGui: unknown,
  Id?: string,
) {
  const DuLieu = SchemaDanhMuc.parse(DuLieuGui, { errorMap: BanDoLoiThongKe });
  if (
    Id &&
    !(await CoSoDuLieu.danhMucThietBi.findFirst({
      where: { Id, DonViId },
      select: { Id: true },
    }))
  )
    throw new LoiKhongTimThay("Không tìm thấy danh mục trong đơn vị.");
  try {
    return Id
      ? await CoSoDuLieu.danhMucThietBi.update({ where: { Id }, data: DuLieu })
      : await CoSoDuLieu.danhMucThietBi.create({
          data: { ...DuLieu, DonViId },
        });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    )
      throw new LoiXungDotDuLieu("Mã hoặc tên danh mục đã có trong đơn vị.");
    throw Loi;
  }
}
export async function XoaDanhMucHoacModel(
  DonViId: string,
  Id: string,
  LaModel: boolean,
) {
  try {
    await CoSoDuLieu.$transaction(
      async (Db) => {
        if (LaModel) {
          const Mau = await Db.mauThietBi.findFirst({
            where: { Id, DanhMuc: { DonViId } },
            select: { Id: true, _count: { select: { DanhSachThietBi: true } } },
          });
          if (!Mau)
            throw new LoiKhongTimThay(
              "Không tìm thấy dòng tài nguyên trong đơn vị.",
            );
          if (Mau._count.DanhSachThietBi)
            throw new LoiXungDotDuLieu(
              "Dòng tài nguyên đang có máy. Hãy chuyển từng máy sang dòng đúng trước khi xóa; không xóa máy kèm dòng tài nguyên.",
            );
          await Db.mauThietBi.delete({ where: { Id } });
        } else {
          const DanhMuc = await Db.danhMucThietBi.findFirst({
            where: { Id, DonViId },
            select: {
              Id: true,
              _count: { select: { DanhSachMau: true, DanhSachThietBi: true } },
            },
          });
          if (!DanhMuc)
            throw new LoiKhongTimThay("Không tìm thấy danh mục trong đơn vị.");
          const CoYeuCau = await Db.caQuay.count({
            where: {
              DuAn: { DonViId },
              CacYeuCauTaiNguyen: {
                array_contains: [{ DanhMucThietBiId: Id }],
              },
            },
          });
          if (
            DanhMuc._count.DanhSachMau ||
            DanhMuc._count.DanhSachThietBi ||
            CoYeuCau
          )
            throw new LoiXungDotDuLieu(
              "Danh mục đang có dòng tài nguyên, máy hoặc yêu cầu ca quay. Không thể xóa dữ liệu đang được sử dụng.",
            );
          await Db.danhMucThietBi.delete({ where: { Id } });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2003", "P2034"].includes(Loi.code)
    )
      throw new LoiXungDotDuLieu(
        "Bản ghi đang được sử dụng hoặc vừa thay đổi. Hãy tải lại và kiểm tra các quan hệ trước khi xóa.",
      );
    throw Loi;
  }
  return { ThongBao: "Đã xóa bản ghi không có dữ liệu phụ thuộc." };
}
