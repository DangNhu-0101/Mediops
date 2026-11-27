import { Prisma } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import { ChonMaChuaDung, TaoMaTuTen } from "./NhomQuyenService.js";

export interface DuLieuChucDanh {
  TenChucDanh?: string;
  DangSuDung?: boolean;
}

// DonViId null là phạm vi chức danh dùng chung do quản trị hệ thống quản lý.
type PhamVi = string | null;

// Chức danh một đơn vị được dùng: chức danh riêng của đơn vị và chức danh dùng chung.
export function DieuKienChucDanhDonVi(DonViId: string) {
  return { OR: [{ DonViId }, { DonViId: null }] };
}

function ChuyenLoiTrungTen(Loi: unknown) {
  if (
    Loi instanceof Prisma.PrismaClientKnownRequestError &&
    Loi.code === "P2002"
  )
    return new LoiXungDotDuLieu("Tên chức danh đã tồn tại.");
  return Loi;
}

// Số lần tên chức danh đã được lưu làm vị trí trong ca quay; phạm vi dùng chung đếm mọi đơn vị.
async function DemPhanCongLichSu(
  Db: Prisma.TransactionClient,
  DonViId: PhamVi,
  DanhSachTen: string[],
) {
  if (!DanhSachTen.length) return new Map<string, number>();
  const Nhom = await Db.caQuayNhanSu.groupBy({
    by: ["ChucDanhPhanCong"],
    where: {
      ChucDanhPhanCong: { in: DanhSachTen },
      ...(DonViId ? { CaQuay: { DuAn: { DonViId } } } : {}),
    },
    _count: { _all: true },
  });
  return new Map(Nhom.map((Muc) => [Muc.ChucDanhPhanCong, Muc._count._all]));
}

function DieuKienYeuCauDungChucDanh(ChucDanhId: string) {
  return {
    CacYeuCauTaiNguyen: { array_contains: [{ ChucDanhId }] },
  } satisfies Prisma.CaQuayWhereInput;
}

// Chức danh riêng không được trùng tên chức danh dùng chung; chức danh dùng chung không trùng nhau.
async function KiemTraTenChucDanh(
  Db: Prisma.TransactionClient,
  DonViId: PhamVi,
  TenChucDanh: string,
  BoQuaId?: string,
) {
  const Trung = await Db.chucDanh.findFirst({
    where: {
      TenChucDanh: { equals: TenChucDanh, mode: "insensitive" },
      ...(DonViId ? DieuKienChucDanhDonVi(DonViId) : { DonViId: null }),
      ...(BoQuaId ? { Id: { not: BoQuaId } } : {}),
    },
    select: { DonViId: true },
  });
  if (Trung)
    throw new LoiXungDotDuLieu(
      Trung.DonViId
        ? "Tên chức danh đã tồn tại trong đơn vị."
        : "Tên chức danh đã có trong danh mục dùng chung.",
    );
}

// Chức danh riêng của các đơn vị trùng tên được gộp vào chức danh dùng chung.
async function GopChucDanhRiengVaoDungChung(
  Db: Prisma.TransactionClient,
  ChucDanhChungId: string,
  TenChucDanh: string,
) {
  const DanhSachRieng = await Db.chucDanh.findMany({
    where: {
      DonViId: { not: null },
      TenChucDanh: { equals: TenChucDanh, mode: "insensitive" },
    },
    select: { Id: true },
  });
  for (const Rieng of DanhSachRieng) {
    await Db.nguoiDung.updateMany({
      where: { ChucDanhId: Rieng.Id },
      data: { ChucDanhId: ChucDanhChungId },
    });
    const DanhSachCa = await Db.caQuay.findMany({
      where: DieuKienYeuCauDungChucDanh(Rieng.Id),
      select: { Id: true, CacYeuCauTaiNguyen: true },
    });
    for (const Ca of DanhSachCa) {
      const CacYeuCau = Array.isArray(Ca.CacYeuCauTaiNguyen)
        ? Ca.CacYeuCauTaiNguyen
        : [];
      await Db.caQuay.update({
        where: { Id: Ca.Id },
        data: {
          CacYeuCauTaiNguyen: CacYeuCau.map((Muc) =>
            Muc &&
            typeof Muc === "object" &&
            !Array.isArray(Muc) &&
            Muc.ChucDanhId === Rieng.Id
              ? { ...Muc, ChucDanhId: ChucDanhChungId }
              : Muc,
          ) as Prisma.InputJsonValue,
        },
      });
    }
    await Db.chucDanh.delete({ where: { Id: Rieng.Id } });
  }
}

export async function LayDanhSachChucDanh(DonViId: PhamVi) {
  const DanhSach = await CoSoDuLieu.chucDanh.findMany({
    where: DonViId ? DieuKienChucDanhDonVi(DonViId) : { DonViId: null },
    select: {
      Id: true,
      DonViId: true,
      TenChucDanh: true,
      DangSuDung: true,
      _count: {
        select: {
          DanhSachNguoiDung: DonViId ? { where: { DonViId } } : true,
        },
      },
    },
    orderBy: [{ DangSuDung: "desc" }, { TenChucDanh: "asc" }],
  });
  const LichSu = await DemPhanCongLichSu(
    CoSoDuLieu,
    DonViId,
    DanhSach.map((Muc) => Muc.TenChucDanh),
  );
  return DanhSach.map((Muc) => ({
    Id: Muc.Id,
    TenChucDanh: Muc.TenChucDanh,
    DangSuDung: Muc.DangSuDung,
    LaDungChung: Muc.DonViId === null,
    SoNguoiDung: Muc._count.DanhSachNguoiDung,
    SoLanPhanCong: LichSu.get(Muc.TenChucDanh) ?? 0,
  }));
}

export async function TaoChucDanh(DonViId: PhamVi, TenChucDanh: string) {
  try {
    return await CoSoDuLieu.$transaction(
      async (Db) => {
        await KiemTraTenChucDanh(Db, DonViId, TenChucDanh);
        const MaDaDung = await Db.chucDanh.findMany({
          where: { DonViId },
          select: { MaChucDanh: true },
        });
        const ChucDanh = await Db.chucDanh.create({
          data: {
            DonViId,
            MaChucDanh: ChonMaChuaDung(
              TaoMaTuTen(TenChucDanh, "CHUC_DANH"),
              MaDaDung.map((Muc) => Muc.MaChucDanh),
            ),
            TenChucDanh,
          },
          select: { Id: true, TenChucDanh: true, DangSuDung: true },
        });
        if (!DonViId)
          await GopChucDanhRiengVaoDungChung(Db, ChucDanh.Id, TenChucDanh);
        return ChucDanh;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (Loi) {
    throw ChuyenLoiTrungTen(Loi);
  }
}

export async function CapNhatChucDanh(
  Id: string,
  DonViId: PhamVi,
  DuLieu: DuLieuChucDanh,
) {
  try {
    return await CoSoDuLieu.$transaction(
      async (Db) => {
        const TonTai = await Db.chucDanh.findFirst({
          where: { Id, DonViId },
          select: { Id: true },
        });
        if (!TonTai) throw new LoiKhongTimThay("Không tìm thấy chức danh.");
        if (DuLieu.TenChucDanh)
          await KiemTraTenChucDanh(Db, DonViId, DuLieu.TenChucDanh, Id);
        const ChucDanh = await Db.chucDanh.update({
          where: { Id },
          data: DuLieu,
          select: { Id: true, TenChucDanh: true, DangSuDung: true },
        });
        if (!DonViId && DuLieu.TenChucDanh)
          await GopChucDanhRiengVaoDungChung(Db, Id, DuLieu.TenChucDanh);
        return ChucDanh;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (Loi) {
    throw ChuyenLoiTrungTen(Loi);
  }
}

// Chức danh đang gán, đang được yêu cầu trong ca hoặc đã dùng trong lịch sử ca chỉ được ngừng sử dụng.
export async function XoaChucDanh(Id: string, DonViId: PhamVi) {
  await CoSoDuLieu.$transaction(
    async (Db) => {
      const ChucDanh = await Db.chucDanh.findFirst({
        where: { Id, DonViId },
        select: {
          TenChucDanh: true,
          _count: { select: { DanhSachNguoiDung: true } },
        },
      });
      if (!ChucDanh) throw new LoiKhongTimThay("Không tìm thấy chức danh.");
      const SoNguoi = ChucDanh._count.DanhSachNguoiDung;
      if (SoNguoi > 0)
        throw new LoiXungDotDuLieu(
          `Không thể xóa chức danh đang gán cho ${SoNguoi} người dùng.`,
        );
      if (await Db.caQuay.count({ where: DieuKienYeuCauDungChucDanh(Id) }))
        throw new LoiXungDotDuLieu(
          "Chức danh đang được yêu cầu trong ca quay, chỉ có thể ngừng sử dụng.",
        );
      const LichSu = await DemPhanCongLichSu(Db, DonViId, [
        ChucDanh.TenChucDanh,
      ]);
      if (LichSu.get(ChucDanh.TenChucDanh))
        throw new LoiXungDotDuLieu(
          "Chức danh đã dùng trong lịch sử ca quay, chỉ có thể ngừng sử dụng.",
        );
      await Db.chucDanh.delete({ where: { Id } });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
