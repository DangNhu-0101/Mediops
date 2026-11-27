import {
  Prisma,
  TrangThaiMuonTra,
  TrangThaiSuCo,
  TrangThaiThietBi,
} from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import { LayTongKho, SchemaLocKho, type LocKho } from "./ThongKeKhoService.js";
import { LayTrangThaiThietBi } from "./TrangThaiHienThiThietBiService.js";
import { LayKyThongKe, SchemaKyThongKe } from "./KyThongKeService.js";

export interface DuLieuThietBi {
  MaQR?: string;
  SoSeri: string;
  TenThietBi: string;
  DanhMucId: string;
  ThongSoKyThuat: Record<string, unknown>;
  TrangThai: TrangThaiThietBi;
  HinhAnhUrl?: string;
  ViTriKho?: string;
  KhoId?: string | null;
  MauThietBiId?: string | null;
  ThoiGianKiemTraSauSuDungPhut?: number;
}

function ThongSoJson(ThongSoKyThuat: Record<string, unknown>) {
  return ThongSoKyThuat as Prisma.InputJsonValue;
}

const ThietBiSelect = {
  Id: true,
  MaQR: true,
  SoSeri: true,
  TenThietBi: true,
  DanhMucId: true,
  MauThietBiId: true,
  MauThietBi: {
    select: { Id: true, MaMau: true, TenMau: true, DanhMucId: true },
  },
  ThongSoKyThuat: true,
  TrangThai: true,
  HinhAnhUrl: true,
  NguonThamKhaoUrl: true,
  ViTriKho: true,
  KhoId: true,
  ThoiGianKiemTraSauSuDungPhut: true,
  DanhMuc: { select: { Id: true, MaDanhMuc: true, TenDanhMuc: true } },
  Kho: {
    select: {
      Id: true,
      MaKho: true,
      TenKho: true,
      DiaChi: true,
      BanKinhXacMinhMet: true,
      DangHoatDong: true,
    },
  },
} satisfies Prisma.ThietBiSelect;

export async function LayDanhSachThietBi(ThamSo: {
  DonViId: string;
  TimKiem?: string;
  DanhMucId?: string;
  TrangThai?: TrangThaiThietBi;
  KhoId?: string;
  ChuaGanKho?: boolean;
  Loc?: LocKho;
}) {
  const Loc =
    ThamSo.Loc ??
    SchemaLocKho.parse({
      ...ThamSo,
      KhoId: ThamSo.ChuaGanKho ? "CHUA_GAN" : ThamSo.KhoId,
      KichThuoc: 50,
    });
  const TongQuan = await LayTongKho(ThamSo.DonViId, Loc);
  const DanhSach = await CoSoDuLieu.thietBi.findMany({
    where: {
      Id: { in: TongQuan.DanhSach.map((Muc) => Muc.Id) },
      DanhMuc: { DonViId: ThamSo.DonViId },
      ...(ThamSo.TrangThai ? { TrangThai: ThamSo.TrangThai } : {}),
    },
    select: ThietBiSelect,
    orderBy: [{ TenThietBi: "asc" }, { Id: "asc" }],
  });
  return DanhSach.map((Muc) => ({
    ...Muc,
    ...LayThongTinHienThi(TongQuan.DanhSach.find((Dong) => Dong.Id === Muc.Id)),
  }));
}
function LayThongTinHienThi(
  Muc:
    | Pick<
        Awaited<ReturnType<typeof LayTrangThaiThietBi>>[number],
        | "TrangThaiHienThi"
        | "CanhBao"
        | "HienCo"
        | "ChanCapPhat"
        | "ViTriThucTe"
      >
    | undefined,
) {
  return {
    ViTriThucTe: Muc?.ViTriThucTe ?? "CHUA_XAC_MINH",
    TrangThaiHienThi: Muc?.TrangThaiHienThi ?? null,
    CanhBao: Muc?.CanhBao ?? [],
    HienCo: Muc?.HienCo ?? false,
    ChanCapPhat: Muc?.ChanCapPhat ?? true,
  };
}
export function LayDanhMucThietBi(DonViId: string) {
  return CoSoDuLieu.danhMucThietBi.findMany({
    where: { DonViId: DonViId },
    select: { Id: true, MaDanhMuc: true, TenDanhMuc: true },
    orderBy: { TenDanhMuc: "asc" },
  });
}
// Danh sách gọn, không phân trang, dùng cho phân công thiết bị và yêu cầu tài nguyên.
export function LayThietBiLuaChon(DonViId: string) {
  return CoSoDuLieu.thietBi.findMany({
    where: { DanhMuc: { DonViId: DonViId } },
    select: {
      Id: true,
      MaQR: true,
      TenThietBi: true,
      DanhMucId: true,
      TrangThai: true,
      ThongSoKyThuat: true,
      DanhMuc: { select: { Id: true, TenDanhMuc: true } },
    },
    orderBy: [{ TenThietBi: "asc" }, { Id: "asc" }],
  });
}
export async function LayChiTietThietBi(Id: string, DonViId: string) {
  const ThietBi = await CoSoDuLieu.thietBi.findFirst({
    where: { Id: Id, DanhMuc: { DonViId: DonViId } },
    select: ThietBiSelect,
  });
  if (!ThietBi) throw new LoiKhongTimThay("Không tìm thấy thiết bị");
  const [HienThi] = await LayTrangThaiThietBi(
    DonViId,
    LayKyThongKe(SchemaKyThongKe.parse({})),
    [Id],
  );
  return { ...ThietBi, ...LayThongTinHienThi(HienThi) };
}
export async function TraCuuThietBiTheoQR(MaQR: string, DonViId: string) {
  const ThietBi = await CoSoDuLieu.thietBi.findFirst({
    where: { MaQR: MaQR, DanhMuc: { DonViId: DonViId } },
    select: ThietBiSelect,
  });
  if (!ThietBi) throw new LoiKhongTimThay("Không tìm thấy thiết bị");
  const [HienThi] = await LayTrangThaiThietBi(
    DonViId,
    LayKyThongKe(SchemaKyThongKe.parse({})),
    [ThietBi.Id],
  );
  return { ...ThietBi, ...LayThongTinHienThi(HienThi) };
}
export async function TaoThietBi(
  DuLieu: DuLieuThietBi,
  DonViId: string,
  DuongDanAnh?: string,
) {
  if (DuLieu.TrangThai === TrangThaiThietBi.DANG_SU_DUNG) {
    throw new LoiXungDotDuLieu(
      "Trạng thái đang sử dụng chỉ được thiết lập khi xuất kho.",
    );
  }
  await KiemTraDanhMuc(DuLieu.DanhMucId, DonViId);
  await KiemTraMau(DuLieu.MauThietBiId, DuLieu.DanhMucId, DonViId);
  await KiemTraKho(DuLieu.KhoId, DonViId);
  try {
    return await CoSoDuLieu.thietBi.create({
      data: {
        ...DuLieu,
        ThongSoKyThuat: ThongSoJson(DuLieu.ThongSoKyThuat),
        MaQR: DuLieu.MaQR ?? `TB-${Date.now().toString(36).toUpperCase()}`,
        ...(DuongDanAnh ? { HinhAnhUrl: DuongDanAnh } : {}),
      },
      select: ThietBiSelect,
    });
  } catch (Loi) {
    throw ChuyenLoiTrungLap(Loi);
  }
}
export async function CapNhatThietBi(
  Id: string,
  DuLieu: DuLieuThietBi,
  DonViId: string,
  DuongDanAnh?: string,
) {
  const ThietBiHienTai = await LayChiTietThietBi(Id, DonViId);
  await KiemTraDanhMuc(DuLieu.DanhMucId, DonViId);
  await KiemTraMau(DuLieu.MauThietBiId, DuLieu.DanhMucId, DonViId);
  await KiemTraKho(DuLieu.KhoId, DonViId, ThietBiHienTai.KhoId);
  try {
    return await CoSoDuLieu.$transaction(
      async (Db) => {
        const [ThietBi, DangMuon, SuCoDangMo] = await Promise.all([
          Db.thietBi.findFirst({
            where: { Id: Id, DanhMuc: { DonViId: DonViId } },
            select: { TrangThai: true, KhoId: true },
          }),
          Db.caQuayThietBi.count({
            where: {
              ThietBiId: Id,
              TrangThaiMuonTra: TrangThaiMuonTra.DA_XUAT_KHO,
            },
          }),
          Db.suCoBaoTri.count({
            where: {
              ThietBiId: Id,
              TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC },
            },
          }),
        ]);
        if (!ThietBi) throw new LoiKhongTimThay("Không tìm thấy thiết bị");
        if (DuLieu.TrangThai === TrangThaiThietBi.DANG_SU_DUNG && !DangMuon) {
          throw new LoiXungDotDuLieu(
            "Trạng thái đang sử dụng chỉ được thiết lập khi xuất kho.",
          );
        }
        if (
          DangMuon &&
          (DuLieu.TrangThai !== TrangThaiThietBi.DANG_SU_DUNG ||
            (DuLieu.KhoId !== undefined && DuLieu.KhoId !== ThietBi.KhoId))
        ) {
          throw new LoiXungDotDuLieu(
            "Thiết bị đang được mượn. Hãy nhập kho trước khi đổi trạng thái hoặc kho.",
          );
        }
        if (SuCoDangMo && DuLieu.TrangThai === TrangThaiThietBi.SAN_SANG) {
          throw new LoiXungDotDuLieu(
            "Thiết bị còn sự cố chưa khắc phục nên chưa thể trở lại sẵn sàng.",
          );
        }
        return Db.thietBi.update({
          where: { Id: Id },
          data: {
            ...DuLieu,
            ThongSoKyThuat: ThongSoJson(DuLieu.ThongSoKyThuat),
            ...(DuongDanAnh ? { HinhAnhUrl: DuongDanAnh } : {}),
          },
          select: ThietBiSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (Loi) {
    throw ChuyenLoiTrungLap(Loi);
  }
}
export async function XoaThietBi(Id: string, DonViId: string) {
  return CoSoDuLieu.$transaction(
    async (Db) => {
      const ThietBi = await Db.thietBi.findFirst({
        where: { Id: Id, DanhMuc: { DonViId: DonViId } },
        select: {
          Id: true,
          _count: {
            select: {
              LichSuCaQuay: true,
              DanhSachSuCo: true,
              NhatKyMuonTra: true,
              DanhSachSuCoVanHanh: true,
            },
          },
        },
      });
      if (!ThietBi) throw new LoiKhongTimThay("Không tìm thấy thiết bị");
      if (Object.values(ThietBi._count).some((SoLuong) => SoLuong > 0))
        throw new LoiXungDotDuLieu(
          "Không thể xóa thiết bị đang có dữ liệu nghiệp vụ liên quan",
        );
      const CoYeuCau = await Db.caQuay.count({
        where: {
          DuAn: { DonViId },
          CacYeuCauTaiNguyen: { array_contains: [{ ThietBiUuTienId: Id }] },
        },
      });
      if (CoYeuCau)
        throw new LoiXungDotDuLieu(
          "Không thể xóa thiết bị đang được tham chiếu trong yêu cầu ca quay",
        );
      await Db.thietBi.delete({ where: { Id: Id } });
    },
    { isolationLevel: "Serializable" },
  );
}

async function KiemTraDanhMuc(DanhMucId: string, DonViId: string) {
  const DanhMuc = await CoSoDuLieu.danhMucThietBi.findFirst({
    where: { Id: DanhMucId, DonViId: DonViId },
    select: { Id: true },
  });
  if (!DanhMuc) throw new LoiKhongTimThay("Không tìm thấy danh mục thiết bị");
}
async function KiemTraKho(
  KhoId: string | null | undefined,
  DonViId: string,
  KhoIdDangGan?: string | null,
) {
  if (!KhoId) return;
  const Kho = await CoSoDuLieu.kho.findFirst({
    where: { Id: KhoId, DonViId: DonViId },
    select: { Id: true, DangHoatDong: true },
  });
  if (!Kho || (!Kho.DangHoatDong && KhoId !== KhoIdDangGan)) {
    throw new LoiKhongTimThay("Không tìm thấy kho đang hoạt động");
  }
}
async function KiemTraMau(
  MauThietBiId: string | null | undefined,
  DanhMucId: string,
  DonViId: string,
) {
  if (!MauThietBiId) return;
  const Mau = await CoSoDuLieu.mauThietBi.findFirst({
    where: { Id: MauThietBiId, DanhMucId, DanhMuc: { DonViId } },
    select: { Id: true },
  });
  if (!Mau)
    throw new LoiKhongTimThay(
      "Dòng tài nguyên không thuộc danh mục và đơn vị đang chọn.",
    );
}
function ChuyenLoiTrungLap(Loi: unknown): unknown {
  if (
    Loi instanceof Prisma.PrismaClientKnownRequestError &&
    Loi.code === "P2002"
  )
    return new LoiXungDotDuLieu("Mã QR hoặc số seri đã được sử dụng");
  return Loi;
}
