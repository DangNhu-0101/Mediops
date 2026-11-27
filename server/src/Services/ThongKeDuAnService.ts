import { Prisma, type TrangThaiDuAn } from "@prisma/client";
import { z } from "zod";
import { CoSoDuLieu } from "../Config/Database.js";
import { PhamViCaQuay } from "./QuyenService.js";
import {
  LayKyThongKe,
  SchemaKyThongKe,
  TinhGioHop,
  type KyThongKe,
} from "./KyThongKeService.js";
import {
  HaiKhoangGiaoNhau,
  TaoKhoangHieuLuc,
  TaoKhoangPhanCongThietBi,
} from "./ThoiGianHieuLucService.js";
import { LoiKhongTimThay } from "./LoiNghiepVuService.js";

export const SchemaThongKeDuAn = SchemaKyThongKe.extend({
  TimKiem: z.string().trim().max(200).optional(),
  TrangThai: z
    .enum(["DANG_CHUAN_BI", "DANG_SAN_XUAT", "HOAN_THANH", "DA_HUY"])
    .optional(),
  TrangTaiNguyen: z.coerce.number().int().min(1).max(100000).default(1),
  CaTimKiem: z.string().trim().max(200).default(""),
  CaTrangThai: z
    .enum(["DU_THAO", "DA_DUYET", "DANG_DIEN_RA", "HOAN_THANH", "DA_HUY"])
    .optional(),
  CaTuNgay: z.string().optional(),
  CaDenNgay: z.string().optional(),
  TaiNguyenTimKiem: z.string().trim().max(200).default(""),
  TaiNguyenCa: z.string().trim().max(200).default(""),
  SuCoTrangThai: z
    .enum(["CHO_XU_LY", "DANG_SUA_CHUA", "DA_KHAC_PHUC"])
    .optional(),
  SuCoTuNgay: z.string().optional(),
  SuCoDenNgay: z.string().optional(),
});
export type LocDuAn = z.infer<typeof SchemaThongKeDuAn>;
export interface PhamViThongKe {
  NguoiDungId: string;
  Quyen: string[];
}
export function DieuKienCaDuocXem(
  DonViId: string,
  PhamVi: PhamViThongKe,
): Prisma.CaQuayWhereInput {
  return {
    DuAn: { DonViId },
    ...(!PhamVi.Quyen.includes("CaQuay.Xem")
      ? PhamViCaQuay(PhamVi.NguoiDungId)
      : {}),
  };
}

const ChonCa = {
  Id: true,
  MaCaQuay: true,
  TieuDe: true,
  TrangThai: true,
  ThoiGianBatDau: true,
  ThoiGianKetThuc: true,
  ThoiGianChuanBiPhut: true,
  ThoiGianThuHoiPhut: true,
  PhongStudio: { select: { Id: true, TenPhong: true } },
  NguoiPhuTrach: { select: { Id: true, HoTen: true } },
  NguoiPhuTrachHieuLucTu: true,
  StudioHieuLucTu: true,
  LichSuStudio: true,
  DanhSachThietBi: {
    select: {
      HieuLucTu: true,
      HieuLucDen: true,
      ThietBi: {
        select: {
          Id: true,
          TenThietBi: true,
          MaQR: true,
          ThoiGianKiemTraSauSuDungPhut: true,
        },
      },
    },
  },
  DanhSachNhanSu: {
    select: {
      HieuLucTu: true,
      HieuLucDen: true,
      NguoiDung: { select: { Id: true, HoTen: true } },
    },
  },
} satisfies Prisma.CaQuaySelect;
type CaThongKe = Prisma.CaQuayGetPayload<{ select: typeof ChonCa }>;

export async function TongHopCa(Where: Prisma.CaQuayWhereInput, Ky: KyThongKe) {
  const DanhSachCa: CaThongKe[] = [];
  let SauId = "";
  while (true) {
    const Lo = await CoSoDuLieu.caQuay.findMany({
      where: { AND: [Where, { Id: { gt: SauId } }] },
      select: ChonCa,
      orderBy: { Id: "asc" },
      take: 250,
    });
    DanhSachCa.push(
      ...Lo.filter(
        (Ca) =>
          Ky.ToanBo ||
          HaiKhoangGiaoNhau(
            TaoKhoangHieuLuc({
              ...Ca,
              ThoiGianKiemTraSauSuDungPhut: Math.max(
                0,
                ...Ca.DanhSachThietBi.map(
                  (Muc) => Muc.ThietBi.ThoiGianKiemTraSauSuDungPhut,
                ),
              ),
            }),
            Ky,
          ),
      ),
    );
    if (Lo.length < 250) break;
    SauId = Lo[Lo.length - 1]!.Id;
  }
  type Nhom = "ThietBi" | "NhanSu" | "Studio";
  type TaiNguyen = {
    Id: string;
    Ten: string;
    SoLuotPhanCong: number;
    LuotDuThao: number;
    GioXepLich: number;
    GioChiemDung: number;
    GioDuThao: number;
    GioThucTe: null;
    CacCa: Array<{ Id: string; TieuDe: string }>;
  };
  const BanDo: Record<
    Nhom,
    Map<
      string,
      {
        Dong: TaiNguyen;
        Quay: Array<{ BatDau: Date; KetThuc: Date }>;
        Chiem: Array<{ BatDau: Date; KetThuc: Date }>;
        DuThao: Array<{ BatDau: Date; KetThuc: Date }>;
      }
    >
  > = { ThietBi: new Map(), NhanSu: new Map(), Studio: new Map() };
  const TheoTrangThai: Record<string, number> = {
    DU_THAO: 0,
    DA_DUYET: 0,
    DANG_DIEN_RA: 0,
    HOAN_THANH: 0,
    DA_HUY: 0,
  };
  for (const Ca of DanhSachCa) {
    TheoTrangThai[Ca.TrangThai] = (TheoTrangThai[Ca.TrangThai] ?? 0) + 1;
    if (Ca.TrangThai === "DA_HUY") continue;
    const NhanSu = [
      {
        ...Ca.NguoiPhuTrach,
        HieuLucTu: Ca.NguoiPhuTrachHieuLucTu,
        HieuLucDen: null,
      },
      ...Ca.DanhSachNhanSu.map(({ NguoiDung, HieuLucTu, HieuLucDen }) => ({
        ...NguoiDung,
        HieuLucTu,
        HieuLucDen,
      })),
    ];
    const CacNguon: Array<{
      Nhom: Nhom;
      Id: string;
      Ten: string;
      Qc: number;
      HieuLucTu?: Date | null;
      HieuLucDen?: Date | null;
    }> = [
      ...Ca.DanhSachThietBi.map(({ ThietBi, HieuLucTu, HieuLucDen }) => ({
        HieuLucTu,
        HieuLucDen,
        Nhom: "ThietBi" as const,
        Id: ThietBi.Id,
        Ten: `${ThietBi.TenThietBi} · ${ThietBi.MaQR}`,
        Qc: ThietBi.ThoiGianKiemTraSauSuDungPhut,
      })),
      ...NhanSu.map((Nguoi) => ({
        Nhom: "NhanSu" as const,
        Id: Nguoi.Id,
        Ten: Nguoi.HoTen,
        HieuLucTu: Nguoi.HieuLucTu,
        HieuLucDen: Nguoi.HieuLucDen,
        Qc: 0,
      })),
      ...(Ca.PhongStudio
        ? [
            {
              Nhom: "Studio" as const,
              Id: Ca.PhongStudio.Id,
              Ten: Ca.PhongStudio.TenPhong,
              HieuLucTu: Ca.StudioHieuLucTu,
              Qc: 0,
            },
          ]
        : []),
    ];
    for (const Muc of Array.isArray(Ca.LichSuStudio) ? Ca.LichSuStudio : []) {
      if (
        Muc &&
        typeof Muc === "object" &&
        !Array.isArray(Muc) &&
        typeof Muc.Id === "string" &&
        typeof Muc.Ten === "string" &&
        typeof Muc.BatDau === "string" &&
        typeof Muc.KetThuc === "string"
      )
        CacNguon.push({
          Nhom: "Studio",
          Id: Muc.Id,
          Ten: Muc.Ten,
          Qc: 0,
          HieuLucTu: new Date(Muc.BatDau),
          HieuLucDen: new Date(Muc.KetThuc),
        });
    }
    for (const Nguon of CacNguon) {
      const Muc = BanDo[Nguon.Nhom].get(Nguon.Id) ?? {
        Dong: {
          Id: Nguon.Id,
          Ten: Nguon.Ten,
          SoLuotPhanCong: 0,
          LuotDuThao: 0,
          GioXepLich: 0,
          GioChiemDung: 0,
          GioDuThao: 0,
          GioThucTe: null,
          CacCa: [],
        },
        Quay: [],
        Chiem: [],
        DuThao: [],
      };
      const KhoangQuay = {
        BatDau: Nguon.HieuLucTu ?? Ca.ThoiGianBatDau,
        KetThuc: Nguon.HieuLucDen ?? Ca.ThoiGianKetThuc,
      };
      if (!Muc.Dong.CacCa.some((MucCa) => MucCa.Id === Ca.Id))
        Muc.Dong.CacCa.push({
          Id: Ca.Id,
          TieuDe: `${Ca.MaCaQuay ?? ""} ${Ca.TieuDe}`.trim(),
        });
      if (Ca.TrangThai === "DU_THAO") {
        Muc.Dong.LuotDuThao++;
        Muc.DuThao.push(KhoangQuay);
      } else {
        Muc.Dong.SoLuotPhanCong++;
        Muc.Quay.push(KhoangQuay);
        Muc.Chiem.push(
          TaoKhoangPhanCongThietBi(
            { ...Ca, ThoiGianKiemTraSauSuDungPhut: Nguon.Qc },
            {
              HieuLucTu: Nguon.HieuLucTu ?? null,
              HieuLucDen: Nguon.HieuLucDen ?? null,
            },
          ),
        );
      }
      BanDo[Nguon.Nhom].set(Nguon.Id, Muc);
    }
  }
  const ChuyenNhom = (Nhom: Nhom) => {
    const DanhSach = [...BanDo[Nhom].values()]
      .map((Muc) => ({
        ...Muc.Dong,
        GioXepLich: TinhGioHop(Muc.Quay, Ky),
        GioChiemDung: TinhGioHop(Muc.Chiem, Ky),
        GioDuThao: TinhGioHop(Muc.DuThao, Ky),
      }))
      .sort(
        (A, B) => A.Ten.localeCompare(B.Ten, "vi") || A.Id.localeCompare(B.Id),
      );
    return {
      DanhSach,
      SoLuongRiengBiet: DanhSach.filter((Muc) => Muc.SoLuotPhanCong > 0).length,
      SoLuongDuThao: DanhSach.filter((Muc) => Muc.LuotDuThao > 0).length,
      SoLuotPhanCong: DanhSach.reduce(
        (Tong, Muc) => Tong + Muc.SoLuotPhanCong,
        0,
      ),
      LuotDuThao: DanhSach.reduce((Tong, Muc) => Tong + Muc.LuotDuThao, 0),
      GioXepLich: DanhSach.reduce((Tong, Muc) => Tong + Muc.GioXepLich, 0),
      GioChiemDung: DanhSach.reduce((Tong, Muc) => Tong + Muc.GioChiemDung, 0),
      GioDuThao: DanhSach.reduce((Tong, Muc) => Tong + Muc.GioDuThao, 0),
      GioThucTe: null,
    };
  };
  const SoCaHopLe = DanhSachCa.filter((Ca) => Ca.TrangThai !== "DA_HUY").length;
  return {
    GioQuayTheoLich: DanhSachCa.filter(
      (Ca) => !["DU_THAO", "DA_HUY"].includes(Ca.TrangThai),
    ).reduce(
      (Tong, Ca) =>
        Tong +
        Math.max(
          0,
          Math.min(+Ca.ThoiGianKetThuc, +Ky.KetThuc) -
            Math.max(+Ca.ThoiGianBatDau, +Ky.BatDau),
        ) /
          3600000,
      0,
    ),
    DanhSachCa: DanhSachCa.sort(
      (A, B) =>
        +B.ThoiGianBatDau - +A.ThoiGianBatDau || A.Id.localeCompare(B.Id),
    ),
    ThongKeCa: {
      TongSo: DanhSachCa.length,
      TheoTrangThai,
      TienDo: SoCaHopLe
        ? ((TheoTrangThai.HOAN_THANH ?? 0) / SoCaHopLe) * 100
        : null,
    },
    TaiNguyen: {
      ThietBi: ChuyenNhom("ThietBi"),
      NhanSu: ChuyenNhom("NhanSu"),
      Studio: ChuyenNhom("Studio"),
    },
  };
}

export async function LayChiTietDuAnThongKe(
  Id: string,
  DonViId: string,
  Loc: LocDuAn,
  PhamVi: PhamViThongKe,
) {
  const DuAn = await CoSoDuLieu.duAn.findFirst({
    where: { Id, DonViId },
    select: {
      Id: true,
      MaDuAn: true,
      TenDuAn: true,
      TenKhachHang: true,
      MoTa: true,
      TrangThai: true,
      HanChot: true,
    },
  });
  if (!DuAn) throw new LoiKhongTimThay("Không tìm thấy dự án.");
  const Ky = LayKyThongKe(Loc);
  const PhamViCa = DieuKienCaDuocXem(DonViId, PhamVi);
  const TongHop = await TongHopCa({ AND: [PhamViCa, { DuAnId: Id }] }, Ky);
  const KhoangTraCuu = (TuNgay?: string, DenNgay?: string) =>
    TuNgay || DenNgay
      ? LayKyThongKe(
          SchemaKyThongKe.parse({
            Ky: "TUY_CHON",
            TuNgay: TuNgay || "1970-01-01",
            DenNgay: DenNgay || "9998-12-31",
          }),
        )
      : null;
  const NgayCa = KhoangTraCuu(Loc.CaTuNgay, Loc.CaDenNgay);
  const NgaySuCo = KhoangTraCuu(Loc.SuCoTuNgay, Loc.SuCoDenNgay);
  const CacCaTraCuu = TongHop.DanhSachCa.filter(
    (Ca) =>
      (!Loc.CaTrangThai || Ca.TrangThai === Loc.CaTrangThai) &&
      `${Ca.MaCaQuay ?? ""} ${Ca.TieuDe}`
        .toLocaleLowerCase("vi")
        .includes(Loc.CaTimKiem.toLocaleLowerCase("vi")) &&
      (!NgayCa ||
        (+Ca.ThoiGianBatDau < +NgayCa.KetThuc &&
          +Ca.ThoiGianKetThuc > +NgayCa.BatDau)),
  );
  const WhereSuCoGoc: Prisma.SuCoBaoTriWhereInput = {
    CaQuay: { AND: [PhamViCa, { DuAnId: Id }] },
    ...(Ky.ToanBo ? {} : { NgayTao: { gte: Ky.BatDau, lt: Ky.KetThuc } }),
  };
  const WhereSuCo: Prisma.SuCoBaoTriWhereInput = {
    ...WhereSuCoGoc,
    ...(Loc.SuCoTrangThai ? { TrangThai: Loc.SuCoTrangThai } : {}),
    ...(NgaySuCo
      ? { NgayTao: { gte: NgaySuCo.BatDau, lt: NgaySuCo.KetThuc } }
      : {}),
  };
  const [SuCo, TongSuCo, TongSuCoToanDuAn] = PhamVi.Quyen.includes("SuCo.Xem")
    ? await Promise.all([
        CoSoDuLieu.suCoBaoTri.findMany({
          where: WhereSuCo,
          select: {
            Id: true,
            MoTaLoi: true,
            TrangThai: true,
            NgayTao: true,
            ThietBi: { select: { Id: true, TenThietBi: true, MaQR: true } },
          },
          orderBy: [{ NgayTao: "desc" }, { Id: "asc" }],
          skip: (Loc.Trang - 1) * Loc.KichThuoc,
          take: Loc.KichThuoc,
        }),
        CoSoDuLieu.suCoBaoTri.count({ where: WhereSuCo }),
        CoSoDuLieu.suCoBaoTri.count({ where: WhereSuCoGoc }),
      ])
    : [[], null, null];
  const PhanTrangNhom = (Nhom: typeof TongHop.TaiNguyen.ThietBi) => {
    const DanhSach = Nhom.DanhSach.filter(
      (Muc) =>
        Muc.Ten.toLocaleLowerCase("vi").includes(
          Loc.TaiNguyenTimKiem.toLocaleLowerCase("vi"),
        ) &&
        (!Loc.TaiNguyenCa ||
          Muc.CacCa.some((Ca) =>
            Ca.TieuDe.toLocaleLowerCase("vi").includes(
              Loc.TaiNguyenCa.toLocaleLowerCase("vi"),
            ),
          )),
    );
    return {
      ...Nhom,
      TongSo: DanhSach.length,
      DanhSach: DanhSach.slice(
        (Loc.TrangTaiNguyen - 1) * Loc.KichThuoc,
        Loc.TrangTaiNguyen * Loc.KichThuoc,
      ).map((Muc) => ({
        ...Muc,
        TongCaLienQuan: Muc.CacCa.length,
        CacCa: Muc.CacCa.slice(0, 5),
      })),
    };
  };
  return {
    ...DuAn,
    Ky,
    ThongKeCa: TongHop.ThongKeCa,
    GioQuayTheoLich: TongHop.GioQuayTheoLich,
    TongCaTraCuu: CacCaTraCuu.length,
    TaiNguyen: {
      ThietBi: PhanTrangNhom(TongHop.TaiNguyen.ThietBi),
      NhanSu: PhanTrangNhom(TongHop.TaiNguyen.NhanSu),
      Studio: PhanTrangNhom(TongHop.TaiNguyen.Studio),
    },
    DanhSachCa: CacCaTraCuu.slice(
      (Loc.Trang - 1) * Loc.KichThuoc,
      Loc.Trang * Loc.KichThuoc,
    ).map((Ca) => ({
      Id: Ca.Id,
      MaCaQuay: Ca.MaCaQuay,
      TieuDe: Ca.TieuDe,
      TrangThai: Ca.TrangThai,
      ThoiGianBatDau: Ca.ThoiGianBatDau,
      ThoiGianKetThuc: Ca.ThoiGianKetThuc,
      PhongStudio: Ca.PhongStudio,
    })),
    SuCo,
    TongSuCo,
    TongSuCoToanDuAn,
    Trang: Loc.Trang,
    TrangTaiNguyen: Loc.TrangTaiNguyen,
    KichThuoc: Loc.KichThuoc,
    GioThucTe: null,
    PhamViCa: PhamVi.Quyen.includes("CaQuay.Xem")
      ? "TOAN_DON_VI"
      : "DUOC_PHAN_CONG",
  };
}

export async function LayTongQuanDuAn(
  DonViId: string,
  Loc: LocDuAn,
  PhamVi: PhamViThongKe,
) {
  const Where: Prisma.DuAnWhereInput = {
    DonViId,
    ...(Loc.TrangThai ? { TrangThai: Loc.TrangThai as TrangThaiDuAn } : {}),
    ...(Loc.TimKiem
      ? {
          OR: ["TenDuAn", "MaDuAn", "TenKhachHang"].map((Truong) => ({
            [Truong]: { contains: Loc.TimKiem, mode: "insensitive" },
          })),
        }
      : {}),
  };
  const Ky = LayKyThongKe(Loc);
  const [TheoTrangThai, TongHop] = await Promise.all([
    CoSoDuLieu.duAn.groupBy({ by: ["TrangThai"], where: Where, _count: true }),
    TongHopCa(
      { AND: [DieuKienCaDuocXem(DonViId, PhamVi), { DuAn: Where }] },
      Ky,
    ),
  ]);
  return {
    Ky,
    TheoTrangThai: Object.fromEntries(
      TheoTrangThai.map((Muc) => [Muc.TrangThai, Muc._count]),
    ),
    TongDuAn: TheoTrangThai.reduce((Tong, Muc) => Tong + Muc._count, 0),
    ThongKeCa: TongHop.ThongKeCa,
    TaiNguyen: Object.fromEntries(
      Object.entries(TongHop.TaiNguyen).map(
        ([Ten, { DanhSach: _DanhSach, ...Tong }]) => [Ten, Tong],
      ),
    ),
    PhamViCa: PhamVi.Quyen.includes("CaQuay.Xem")
      ? "TOAN_DON_VI"
      : "DUOC_PHAN_CONG",
  };
}

// Danh sách quản lý chỉ cần số dự án, không đọc phân công/giờ tài nguyên.
export async function LayTomTatDuAn(DonViId: string, Loc: LocDuAn) {
  const TheoTrangThai = await CoSoDuLieu.duAn.groupBy({
    by: ["TrangThai"],
    where: {
      DonViId,
      ...(Loc.TrangThai ? { TrangThai: Loc.TrangThai } : {}),
      ...(Loc.TimKiem
        ? {
            OR: ["TenDuAn", "MaDuAn", "TenKhachHang"].map((Truong) => ({
              [Truong]: { contains: Loc.TimKiem, mode: "insensitive" },
            })),
          }
        : {}),
    },
    _count: true,
  });
  return {
    TongDuAn: TheoTrangThai.reduce((Tong, Muc) => Tong + Muc._count, 0),
    TheoTrangThai: Object.fromEntries(
      TheoTrangThai.map((Muc) => [Muc.TrangThai, Muc._count]),
    ),
  };
}
