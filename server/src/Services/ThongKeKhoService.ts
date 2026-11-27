import { TaoKhoangPhanCongThietBi } from "./ThoiGianHieuLucService.js";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { MocThoiGianSql } from "./KyThongKeService.js";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  SchemaKyThongKe,
  LayKyThongKe,
  type KyThongKe,
} from "./KyThongKeService.js";
import {
  LayTrangThaiThietBi,
  type TrangThaiHienThi,
} from "./TrangThaiHienThiThietBiService.js";
import { LoiKhongTimThay } from "./LoiNghiepVuService.js";
import { DieuKienCaDuocXem, type PhamViThongKe } from "./ThongKeDuAnService.js";

export const SchemaLocKho = SchemaKyThongKe.extend({
  TrangNhom: z.coerce.number().int().min(1).max(100000).default(1),
  TimKiem: z.string().trim().max(200).optional(),
  LoaiHanhDong: z.enum(["XUAT_KHO", "NHAP_KHO"]).optional(),
  SuCoTrangThai: z
    .enum(["CHO_XU_LY", "DANG_SUA_CHUA", "DA_KHAC_PHUC"])
    .optional(),
  KhoId: z.string().max(100).optional(),
  DanhMucId: z.string().uuid().optional(),
  MauThietBiId: z.string().max(100).optional(),
  TrangThaiHienThi: z
    .enum(["RANH", "CHO_SU_DUNG", "DANG_SU_DUNG", "BAO_TRI", "NGOAI_LE"])
    .optional(),
  CoSoKho: z.enum(["HIEN_TAI", "NGUON_XUAT"]).default("HIEN_TAI"),
  NhomTheo: z.enum(["THIET_BI", "MODEL"]).default("THIET_BI"),
  SapXep: z.enum(["LUOT_MUON", "GIO_NGOAI_KHO"]).default("LUOT_MUON"),
});
export type LocKho = z.infer<typeof SchemaLocKho>;

export async function LayTongKho(
  DonViId: string,
  Loc: LocKho,
  PhamVi?: PhamViThongKe,
) {
  const Ky = LayKyThongKe(Loc);
  const TatCa = await LayTrangThaiThietBi(DonViId, Ky);
  const DanhSach = TatCa.filter(
    (Muc) =>
      (!Loc.KhoId ||
        (Loc.KhoId === "CHUA_GAN" ? !Muc.KhoId : Muc.KhoId === Loc.KhoId)) &&
      (!Loc.DanhMucId || Muc.DanhMucId === Loc.DanhMucId) &&
      (!Loc.MauThietBiId ||
        (Loc.MauThietBiId === "CHUA_XAC_DINH"
          ? !Muc.MauThietBiId
          : Muc.MauThietBiId === Loc.MauThietBiId)) &&
      (!Loc.TrangThaiHienThi ||
        (Loc.TrangThaiHienThi === "NGOAI_LE"
          ? Muc.CoNgoaiLe
          : Muc.TrangThaiHienThi === Loc.TrangThaiHienThi)) &&
      (!Loc.TimKiem ||
        [
          Muc.TenThietBi,
          Muc.MaQR,
          Muc.SoSeri,
          Muc.TenMau ?? "",
          Muc.MaMau ?? "",
          Muc.MaDanhMuc ?? "",
          Muc.TenDanhMuc,
          Muc.TenKho ?? "",
          Muc.MaKho ?? "",
        ].some((Ten) =>
          Ten.toLocaleLowerCase("vi").includes(
            Loc.TimKiem!.toLocaleLowerCase("vi"),
          ),
        )),
  );
  const TinhTong = (CacMay: typeof DanhSach) => ({
    TongSo: CacMay.length,
    HienCo: CacMay.filter((Muc) => Muc.HienCo).length,
    DangSuDung: CacMay.filter((Muc) => Muc.TrangThaiHienThi === "DANG_SU_DUNG")
      .length,
    BaoTri: CacMay.filter((Muc) => Muc.TrangThaiHienThi === "BAO_TRI").length,
    ChoSuDung: CacMay.filter((Muc) => Muc.TrangThaiHienThi === "CHO_SU_DUNG")
      .length,
    Ranh: CacMay.filter((Muc) => Muc.TrangThaiHienThi === "RANH").length,
    NgoaiLe: CacMay.filter((Muc) => Muc.CoNgoaiLe).length,
  });
  const Nhom = new Map<string, typeof DanhSach>();
  for (const Muc of DanhSach) {
    const Khoa = Muc.MauThietBiId ?? `CHUA_XAC_DINH:${Muc.Id}`;
    const CacMay = Nhom.get(Khoa) ?? [];
    CacMay.push(Muc);
    Nhom.set(Khoa, CacMay);
  }
  const NhomModel = [...Nhom]
    .map(([Khoa, CacMay]) => ({
      Khoa,
      MauThietBiId: CacMay[0]!.MauThietBiId,
      TenMau:
        CacMay[0]!.TenMau ??
        `Chưa xác định dòng tài nguyên · ${CacMay[0]!.MaQR}`,
      TenDanhMuc: CacMay[0]!.TenDanhMuc,
      ...TinhTong(CacMay),
    }))
    .sort((A, B) => A.TenMau.localeCompare(B.TenMau, "vi"));
  DanhSach.sort(
    (A, B) =>
      A.TenThietBi.localeCompare(B.TenThietBi, "vi") ||
      A.Id.localeCompare(B.Id),
  );
  const Dau = (Loc.Trang - 1) * Loc.KichThuoc;
  const TrangMay = DanhSach.slice(Dau, Dau + Loc.KichThuoc);
  const CaDangGiu =
    PhamVi && TrangMay.length
      ? await CoSoDuLieu.caQuayThietBi.findMany({
          where: {
            ThietBiId: { in: TrangMay.map((Muc) => Muc.Id) },
            OR: [
              { TrangThaiMuonTra: "DA_XUAT_KHO" },
              { ThoiGianXuatKho: { not: null }, ThoiGianNhapKho: null },
            ],
            CaQuay: DieuKienCaDuocXem(DonViId, PhamVi),
          },
          select: {
            ThietBiId: true,
            CaQuay: { select: { Id: true, TieuDe: true } },
          },
          orderBy: { Id: "asc" },
        })
      : [];
  const NhomKho = new Map<string, typeof TatCa>();
  for (const Muc of TatCa) {
    const Khoa = Muc.KhoId ?? "CHUA_GAN";
    const May = NhomKho.get(Khoa) ?? [];
    May.push(Muc);
    NhomKho.set(Khoa, May);
  }
  return {
    Ky,
    ThongKe: TinhTong(DanhSach),
    TongSo: DanhSach.length,
    TongNhom: NhomModel.length,
    NhomModel: NhomModel.slice(
      (Loc.TrangNhom - 1) * Loc.KichThuoc,
      Loc.TrangNhom * Loc.KichThuoc,
    ),
    TrangNhom: Loc.TrangNhom,
    DanhSach: TrangMay.map(({ CacKhoangKhongKhaDung: _KhoangBan, ...Muc }) => {
      const ViTriThucTe = Muc.ViTriThucTe;
      return {
        ...Muc,
        ViTriThucTe,
        ViTriKho: ViTriThucTe === "TAI_KHO" ? Muc.ViTriKho : null,
        CaDangGiu: CaDangGiu.filter((Ca) => Ca.ThietBiId === Muc.Id).map(
          (Ca) => Ca.CaQuay,
        ),
      };
    }),
    NhomKho: [...NhomKho].map(([Id, May]) => ({
      Id,
      TenKho: May[0]!.TenKho ?? "Chưa gán kho",
      ...TinhTong(May),
    })),
    ChuaGanKho: TatCa.filter((Muc) => !Muc.KhoId).length,
    BoLocModel: [
      ...new Map(
        TatCa.filter(
          (Muc) =>
            (!Loc.KhoId ||
              (Loc.KhoId === "CHUA_GAN"
                ? !Muc.KhoId
                : Muc.KhoId === Loc.KhoId)) &&
            (!Loc.DanhMucId || Muc.DanhMucId === Loc.DanhMucId),
        ).map((Muc) => [
          Muc.MauThietBiId ?? "CHUA_XAC_DINH",
          {
            Id: Muc.MauThietBiId ?? "CHUA_XAC_DINH",
            Ten: Muc.TenMau ?? "Chưa xác định dòng tài nguyên",
          },
        ]),
      ).values(),
    ].map((Mau) => ({
      ...Mau,
      SoMay: TatCa.filter(
        (Muc) =>
          (Muc.MauThietBiId ?? "CHUA_XAC_DINH") === Mau.Id &&
          (!Loc.KhoId ||
            (Loc.KhoId === "CHUA_GAN"
              ? !Muc.KhoId
              : Muc.KhoId === Loc.KhoId)) &&
          (!Loc.DanhMucId || Muc.DanhMucId === Loc.DanhMucId),
      ).length,
    })),
    Trang: Loc.Trang,
    KichThuoc: Loc.KichThuoc,
    CacKho: [
      ...new Map(
        TatCa.map((Muc) => [
          Muc.KhoId ?? "CHUA_GAN",
          { Id: Muc.KhoId, TenKho: Muc.TenKho ?? "Chưa gán kho" },
        ]),
      ).values(),
    ],
  };
}

// Chỉ tính một lần mỗi chuyển tiếp xuất → nhập. Quét hoặc request lặp không tạo lượt mượn.
export function NguonLuotMuon(DonViId: string) {
  return Prisma.sql`WITH su_kien AS (
    SELECT DISTINCT ON (n."thietBiId", COALESCE(n."giaoDichKhoId", n."loaiHanhDong"::text || n."thoiGian"::text))
      n.id, n."thietBiId", n."caQuayId", n."loaiHanhDong"::text AS loai, n."thoiGian" AS luc,
      COALESCE(g."khoId", n."khoNguonId") AS kho_nguon
    FROM nhat_ky_muon_tra n JOIN thiet_bi t ON t.id=n."thietBiId" JOIN danh_muc_thiet_bi d ON d.id=t."danhMucId"
    LEFT JOIN giao_dich_kho g ON g.id=n."giaoDichKhoId"
    WHERE d."donViId"=${DonViId} AND n."loaiHanhDong" IN ('XUAT_KHO','NHAP_KHO')
    ORDER BY n."thietBiId", COALESCE(n."giaoDichKhoId", n."loaiHanhDong"::text || n."thoiGian"::text), n."thoiGian", n.id
  ), su_kien_day_du AS (
    SELECT * FROM su_kien
    UNION ALL
    SELECT p.id || '-xuat', p."thietBiId", p."caQuayId", 'XUAT_KHO', p."thoiGianXuatKho", NULL::text
    FROM ca_quay_thiet_bi p JOIN thiet_bi t ON t.id=p."thietBiId" JOIN danh_muc_thiet_bi d ON d.id=t."danhMucId"
    WHERE d."donViId"=${DonViId} AND p."thoiGianXuatKho" IS NOT NULL
      AND NOT EXISTS(SELECT 1 FROM su_kien n WHERE n."thietBiId"=p."thietBiId" AND n."caQuayId"=p."caQuayId" AND n.loai='XUAT_KHO')
    UNION ALL
    SELECT p.id || '-nhap', p."thietBiId", p."caQuayId", 'NHAP_KHO', p."thoiGianNhapKho", NULL::text
    FROM ca_quay_thiet_bi p JOIN thiet_bi t ON t.id=p."thietBiId" JOIN danh_muc_thiet_bi d ON d.id=t."danhMucId"
    WHERE d."donViId"=${DonViId} AND p."thoiGianNhapKho" IS NOT NULL
      AND NOT EXISTS(SELECT 1 FROM su_kien n WHERE n."thietBiId"=p."thietBiId" AND n."caQuayId"=p."caQuayId" AND n.loai='NHAP_KHO')
  ), chuyen_tiep AS (
    SELECT *, LAG(loai) OVER (PARTITION BY "thietBiId" ORDER BY luc, CASE WHEN loai='XUAT_KHO' THEN 0 ELSE 1 END, id) AS truoc FROM su_kien_day_du
  ), luot AS (
    SELECT x.id, x."thietBiId", x."caQuayId", x.kho_nguon, x.luc AS xuat,
      (SELECT MIN(n.luc) FROM su_kien_day_du n WHERE n."thietBiId"=x."thietBiId" AND n.loai='NHAP_KHO' AND n.luc>=x.luc) AS nhap
    FROM chuyen_tiep x WHERE x.loai='XUAT_KHO' AND x.truoc IS DISTINCT FROM 'XUAT_KHO'
  )`;
}

async function DemMayThieuMocMuon(DonViId: string, ThietBiId?: string) {
  const Dem = await CoSoDuLieu.$queryRaw<Array<{ SoMay: number }>>(Prisma.sql`
    SELECT COUNT(DISTINCT p."thietBiId")::int AS "SoMay" FROM ca_quay_thiet_bi p
    JOIN thiet_bi t ON t.id=p."thietBiId" JOIN danh_muc_thiet_bi d ON d.id=t."danhMucId"
    WHERE d."donViId"=${DonViId} AND p."trangThaiMuonTra"='DA_XUAT_KHO' AND p."thoiGianXuatKho" IS NULL
    ${ThietBiId ? Prisma.sql`AND t.id=${ThietBiId}` : Prisma.empty}
    AND NOT EXISTS(SELECT 1 FROM nhat_ky_muon_tra n WHERE n."thietBiId"=p."thietBiId" AND n."caQuayId"=p."caQuayId" AND n."loaiHanhDong"='XUAT_KHO')`);
  return Dem[0]?.SoMay ?? 0;
}

function DieuKienLuot(Loc: LocKho, Ky: KyThongKe) {
  return Prisma.sql`l.xuat < ${MocThoiGianSql(Ky.KetThuc)} AND COALESCE(l.nhap, ${MocThoiGianSql(Ky.HienTai)}) >= ${MocThoiGianSql(Ky.BatDau)}
    ${Loc.KhoId ? Prisma.sql`AND ${Loc.CoSoKho === "NGUON_XUAT" ? Prisma.sql`l.kho_nguon` : Prisma.sql`t."khoId"`} IS NOT DISTINCT FROM ${Loc.KhoId === "CHUA_GAN" ? null : Loc.KhoId}` : Prisma.empty}
    ${Loc.DanhMucId ? Prisma.sql`AND t."danhMucId"=${Loc.DanhMucId}` : Prisma.empty}
    ${Loc.MauThietBiId ? (Loc.MauThietBiId === "CHUA_XAC_DINH" ? Prisma.sql`AND t."mauThietBiId" IS NULL` : Prisma.sql`AND t."mauThietBiId"=${Loc.MauThietBiId}`) : Prisma.empty}`;
}

export async function LayMucDoMuon(DonViId: string, Loc: LocKho) {
  const Ky = LayKyThongKe(Loc);
  const Khoa =
    Loc.NhomTheo === "MODEL"
      ? Prisma.sql`COALESCE(t."mauThietBiId", t.id)`
      : Prisma.sql`t.id`;
  const Ten =
    Loc.NhomTheo === "MODEL"
      ? Prisma.sql`COALESCE(m."tenMau", 'Chưa xác định dòng tài nguyên · ' || t."maQR")`
      : Prisma.sql`t."tenThietBi" || ' · ' || COALESCE(m."tenMau", 'Chưa xác định dòng tài nguyên') || ' · ' || t."maQR"`;
  const Cte = Prisma.sql`${NguonLuotMuon(DonViId)}, tong AS (
    SELECT ${Khoa} AS "Id", ${Ten} AS "Ten", COUNT(*) FILTER (WHERE l.xuat >= ${MocThoiGianSql(Ky.BatDau)} AND l.xuat < ${MocThoiGianSql(Ky.KetThuc)})::int AS "SoLuotMuon",
      COUNT(DISTINCT t.id) FILTER (WHERE l.xuat >= ${MocThoiGianSql(Ky.BatDau)} AND l.xuat < ${MocThoiGianSql(Ky.KetThuc)})::int AS "SoMayRiengBiet",
      SUM(GREATEST(0, EXTRACT(EPOCH FROM (LEAST(COALESCE(l.nhap, ${MocThoiGianSql(Ky.HienTai)}), ${MocThoiGianSql(Ky.KetThuc)}, ${MocThoiGianSql(Ky.HienTai)}) - GREATEST(l.xuat, ${MocThoiGianSql(Ky.BatDau)})))) / 3600)::float8 AS "GioNgoaiKho"
    FROM luot l JOIN thiet_bi t ON t.id=l."thietBiId" LEFT JOIN mau_thiet_bi m ON m.id=t."mauThietBiId"
    WHERE ${DieuKienLuot(Loc, Ky)} GROUP BY ${Khoa}, ${Ten}
  )`;
  type Dong = {
    Id: string;
    Ten: string;
    SoLuotMuon: number;
    SoMayRiengBiet: number;
    GioNgoaiKho: number;
  };
  const [DanhSach, Dem, CacKho, SoMayThieuDuLieu] = await Promise.all([
    CoSoDuLieu.$queryRaw<Dong[]>(
      Prisma.sql`${Cte} SELECT * FROM tong ORDER BY ${Loc.SapXep === "LUOT_MUON" ? Prisma.sql`"SoLuotMuon"` : Prisma.sql`"GioNgoaiKho"`} DESC, "Ten", "Id" LIMIT ${Loc.KichThuoc} OFFSET ${(Loc.Trang - 1) * Loc.KichThuoc}`,
    ),
    CoSoDuLieu.$queryRaw<Array<{ TongSo: number }>>(
      Prisma.sql`${Cte} SELECT COUNT(*)::int AS "TongSo" FROM tong`,
    ),
    CoSoDuLieu.kho.findMany({
      where: { DonViId },
      select: { Id: true, TenKho: true },
      orderBy: { TenKho: "asc" },
    }),
    DemMayThieuMocMuon(DonViId),
  ]);
  return {
    DanhSach,
    TongSo: Dem[0]?.TongSo ?? 0,
    Trang: Loc.Trang,
    KichThuoc: Loc.KichThuoc,
    Ky,
    CoSoKho: Loc.CoSoKho,
    CacKho,
    SoMayThieuDuLieu,
  };
}

export async function LayLichSuMuon(
  ThietBiId: string,
  DonViId: string,
  Loc: LocKho,
) {
  const TonTai = await CoSoDuLieu.thietBi.findFirst({
    where: { Id: ThietBiId, DanhMuc: { DonViId } },
    select: { Id: true },
  });
  if (!TonTai) throw new LoiKhongTimThay("Không tìm thấy thiết bị");
  const Ky = LayKyThongKe(Loc);
  const Cte = Prisma.sql`${NguonLuotMuon(DonViId)}, da_loc AS (SELECT l.* FROM luot l JOIN thiet_bi t ON t.id=l."thietBiId" WHERE l."thietBiId"=${ThietBiId} AND ${DieuKienLuot(Loc, Ky)})`;
  const [DanhSach, Tong, SoMayThieuDuLieu] = await Promise.all([
    CoSoDuLieu.$queryRaw<
      Array<{
        Id: string;
        ThoiGianXuat: Date;
        ThoiGianNhap: Date | null;
        TenKhoNguon: string | null;
        TenCa: string;
        GioNgoaiKho: number;
      }>
    >(
      Prisma.sql`${Cte} SELECT l.id AS "Id", l.xuat AS "ThoiGianXuat", l.nhap AS "ThoiGianNhap", k."tenKho" AS "TenKhoNguon", c."tieuDe" AS "TenCa", GREATEST(0, EXTRACT(EPOCH FROM (LEAST(COALESCE(l.nhap, ${MocThoiGianSql(Ky.HienTai)}), ${MocThoiGianSql(Ky.KetThuc)}, ${MocThoiGianSql(Ky.HienTai)}) - GREATEST(l.xuat, ${MocThoiGianSql(Ky.BatDau)}))))::float8 / 3600 AS "GioNgoaiKho" FROM da_loc l LEFT JOIN kho k ON k.id=l.kho_nguon JOIN ca_quay c ON c.id=l."caQuayId" ORDER BY l.xuat DESC, l.id LIMIT ${Loc.KichThuoc} OFFSET ${(Loc.Trang - 1) * Loc.KichThuoc}`,
    ),
    CoSoDuLieu.$queryRaw<
      Array<{ TongSo: number; SoLuotMuon: number; GioNgoaiKho: number }>
    >(
      Prisma.sql`${Cte} SELECT COUNT(*)::int AS "TongSo", COUNT(*) FILTER (WHERE xuat >= ${MocThoiGianSql(Ky.BatDau)} AND xuat < ${MocThoiGianSql(Ky.KetThuc)})::int AS "SoLuotMuon", COALESCE(SUM(GREATEST(0, EXTRACT(EPOCH FROM (LEAST(COALESCE(nhap, ${MocThoiGianSql(Ky.HienTai)}), ${MocThoiGianSql(Ky.KetThuc)}, ${MocThoiGianSql(Ky.HienTai)}) - GREATEST(xuat, ${MocThoiGianSql(Ky.BatDau)})))) / 3600),0)::float8 AS "GioNgoaiKho" FROM da_loc`,
    ),
    DemMayThieuMocMuon(DonViId, ThietBiId),
  ]);
  return {
    DanhSach,
    ...Tong[0]!,
    GioNgoaiKho: SoMayThieuDuLieu ? null : Tong[0]!.GioNgoaiKho,
    SoLuotMuon: SoMayThieuDuLieu ? null : Tong[0]!.SoLuotMuon,
    SoMayThieuDuLieu,
    Trang: Loc.Trang,
    KichThuoc: Loc.KichThuoc,
    Ky,
  };
}

export async function LayLichPhanCongThietBi(
  ThietBiId: string,
  DonViId: string,
  Loc: LocKho,
  PhamVi: PhamViThongKe,
) {
  const ThietBi = await CoSoDuLieu.thietBi.findFirst({
    where: { Id: ThietBiId, DanhMuc: { DonViId } },
    select: { ThoiGianKiemTraSauSuDungPhut: true },
  });
  if (!ThietBi) throw new LoiKhongTimThay("Không tìm thấy thiết bị.");
  const Ky = LayKyThongKe(Loc);
  const Where = {
    ThietBiId,
    CaQuay: {
      AND: [
        DieuKienCaDuocXem(DonViId, PhamVi),
        ...(Ky.ToanBo
          ? []
          : [
              {
                ThoiGianBatDau: { lt: Ky.KetThuc },
                ThoiGianKetThuc: { gt: Ky.BatDau },
              },
            ]),
      ],
    },
  };
  const [DanhSach, TongSo] = await Promise.all([
    CoSoDuLieu.caQuayThietBi.findMany({
      where: Where,
      select: {
        HieuLucTu: true,
        HieuLucDen: true,
        CaQuay: {
          select: {
            Id: true,
            TieuDe: true,
            TrangThai: true,
            ThoiGianBatDau: true,
            ThoiGianKetThuc: true,
            ThoiGianChuanBiPhut: true,
            ThoiGianThuHoiPhut: true,
            DuAn: { select: { TenDuAn: true } },
          },
        },
      },
      orderBy: [{ CaQuay: { ThoiGianBatDau: "desc" } }, { Id: "asc" }],
      skip: (Loc.Trang - 1) * Loc.KichThuoc,
      take: Loc.KichThuoc,
    }),
    CoSoDuLieu.caQuayThietBi.count({ where: Where }),
  ]);
  return {
    DanhSach: DanhSach.map(({ CaQuay, HieuLucTu, HieuLucDen }) => ({
      ...CaQuay,
      KhoangChiemDung: TaoKhoangPhanCongThietBi(
        {
          ...CaQuay,
          ThoiGianKiemTraSauSuDungPhut: ThietBi.ThoiGianKiemTraSauSuDungPhut,
        },
        { HieuLucTu, HieuLucDen },
      ),
    })),
    TongSo,
    Trang: Loc.Trang,
    KichThuoc: Loc.KichThuoc,
  };
}
