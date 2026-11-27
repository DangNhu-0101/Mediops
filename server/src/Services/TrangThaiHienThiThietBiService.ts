import { Prisma } from "@prisma/client";
import { MocThoiGianSql } from "./KyThongKeService.js";
import { CoSoDuLieu } from "../Config/Database.js";
import { DocKhoangBan } from "./DuLieuNhungService.js";
import {
  HaiKhoangGiaoNhau,
  TaoKhoangHieuLucSql,
} from "./ThoiGianHieuLucService.js";
import type { KyThongKe } from "./KyThongKeService.js";

export type TrangThaiHienThi =
  "RANH" | "CHO_SU_DUNG" | "DANG_SU_DUNG" | "BAO_TRI";
export interface DuLieuTrangThai {
  Id: string;
  TenThietBi: string;
  MaQR: string;
  SoSeri: string;
  KhoId: string | null;
  TenKho: string | null;
  MaKho?: string | null;
  ViTriKho?: string | null;
  DanhMucId: string;
  TenDanhMuc: string;
  MauThietBiId: string | null;
  TenMau: string | null;
  MaMau?: string | null;
  MaDanhMuc?: string | null;
  TrangThai: string;
  CoKhoanMuon: boolean;
  CoSuCo: boolean;
  ThatLac: boolean;
  CoLich: boolean;
  QuaHan: boolean;
  KhoHoatDong: boolean | null;
  CacKhoangKhongKhaDung: unknown;
}

export function XacDinhTrangThai(ThietBi: DuLieuTrangThai, Ky: KyThongKe) {
  const KhoangXet = Ky.ToanBo
    ? { BatDau: Ky.HienTai, KetThuc: new Date(+Ky.HienTai + 1) }
    : Ky;
  const CoKhoangBan = DocKhoangBan(ThietBi.CacKhoangKhongKhaDung).some(
    (Khoang) =>
      HaiKhoangGiaoNhau(KhoangXet, {
        BatDau: new Date(Khoang.BatDau),
        KetThuc: new Date(Khoang.KetThuc),
      }),
  );
  const CanhBao: string[] = [];
  if (ThietBi.CoSuCo) CanhBao.push("Có sự cố chưa khắc phục");
  if (ThietBi.CoKhoanMuon && ["BAO_TRI", "HU_HONG"].includes(ThietBi.TrangThai))
    CanhBao.push("Có ghi nhận hỏng hoặc bảo trì trong khi máy chưa nhập kho");
  if (ThietBi.ThatLac)
    CanhBao.push("Có ghi nhận thất lạc, cần xác minh vị trí");
  if (!ThietBi.KhoId) CanhBao.push("Chưa gán kho, chưa xác minh vị trí");
  if (ThietBi.QuaHan) CanhBao.push("Đã quá thời gian ca nhưng chưa nhập kho");
  if (CoKhoangBan) CanhBao.push("Có khoảng không khả dụng trong kỳ đang xét");
  if (ThietBi.KhoHoatDong === false)
    CanhBao.push("Kho đang vô hiệu hóa, không cấp phát mới");
  const BaoTri =
    ThietBi.CoSuCo || ["BAO_TRI", "HU_HONG"].includes(ThietBi.TrangThai);
  const ChuaXacMinh =
    ThietBi.ThatLac ||
    !ThietBi.KhoId ||
    (!ThietBi.CoKhoanMuon && ThietBi.TrangThai === "DANG_SU_DUNG");
  if (!ThietBi.CoKhoanMuon && ThietBi.TrangThai === "DANG_SU_DUNG")
    CanhBao.push("Trạng thái và khoản mượn chưa khớp, cần xác minh");
  const TrangThaiHienThi: TrangThaiHienThi | null = ThietBi.CoKhoanMuon
    ? "DANG_SU_DUNG"
    : BaoTri
      ? "BAO_TRI"
      : ChuaXacMinh || CoKhoangBan || ThietBi.KhoHoatDong === false
        ? null
        : ThietBi.CoLich
          ? "CHO_SU_DUNG"
          : "RANH";
  const ViTriThucTe = ThietBi.ThatLac
    ? ("CHUA_XAC_MINH" as const)
    : ThietBi.CoKhoanMuon
      ? ("NGOAI_KHO" as const)
      : !ThietBi.KhoId || ThietBi.TrangThai === "DANG_SU_DUNG"
        ? ("CHUA_XAC_MINH" as const)
        : ("TAI_KHO" as const);
  return {
    ViTriThucTe,
    ViTriKho: ViTriThucTe === "TAI_KHO" ? (ThietBi.ViTriKho ?? null) : null,
    TrangThaiHienThi,
    CanhBao,
    HienCo:
      !ThietBi.CoKhoanMuon &&
      !BaoTri &&
      !ChuaXacMinh &&
      !CoKhoangBan &&
      ThietBi.KhoHoatDong !== false,
    CoNgoaiLe: ChuaXacMinh || CoKhoangBan || ThietBi.KhoHoatDong === false,
    ChanCapPhat:
      ThietBi.CoKhoanMuon ||
      BaoTri ||
      ChuaXacMinh ||
      CoKhoangBan ||
      ThietBi.KhoHoatDong === false,
  };
}

export async function LayTrangThaiThietBi(
  DonViId: string,
  Ky: KyThongKe,
  Id?: string[],
) {
  const BatDau = Ky.ToanBo ? Ky.HienTai : Ky.BatDau;
  const KetThuc = Ky.ToanBo ? new Date(+Ky.HienTai + 1) : Ky.KetThuc;
  const KhoangHieuLuc = TaoKhoangHieuLucSql({
    ThoiGianBatDau: Prisma.sql`c."thoiGianBatDau"`,
    ThoiGianKetThuc: Prisma.sql`c."thoiGianKetThuc"`,
    ThoiGianChuanBiPhut: Prisma.sql`c."thoiGianChuanBiPhut"`,
    ThoiGianThuHoiPhut: Prisma.sql`c."thoiGianThuHoiPhut"`,
    ThoiGianKiemTraSauSuDungPhut: Prisma.sql`t."thoiGianKiemTraSauSuDungPhut"`,
  });
  const KetQua: Array<DuLieuTrangThai & ReturnType<typeof XacDinhTrangThai>> =
    [];
  let SauId = "";
  // Đọc theo lô hữu hạn; EXISTS chỉ đọc dữ liệu cần phân loại, không tải lịch sử về client.
  while (true) {
    const Lo = await CoSoDuLieu.$queryRaw<DuLieuTrangThai[]>(Prisma.sql`
      SELECT t."id" AS "Id", t."tenThietBi" AS "TenThietBi", t."maQR" AS "MaQR", t."soSeri" AS "SoSeri",
        t."khoId" AS "KhoId", k."tenKho" AS "TenKho", k."maKho" AS "MaKho", t."viTriKho" AS "ViTriKho", k."dangHoatDong" AS "KhoHoatDong",
        t."danhMucId" AS "DanhMucId", d."tenDanhMuc" AS "TenDanhMuc", d."maDanhMuc" AS "MaDanhMuc", t."mauThietBiId" AS "MauThietBiId", m."tenMau" AS "TenMau", m."maMau" AS "MaMau",
        t."trangThai"::text AS "TrangThai", t."cacKhoangKhongKhaDung" AS "CacKhoangKhongKhaDung",
        EXISTS(SELECT 1 FROM ca_quay_thiet_bi p WHERE p."thietBiId"=t.id AND
          (p."trangThaiMuonTra"='DA_XUAT_KHO' OR (p."thoiGianXuatKho" IS NOT NULL AND p."thoiGianNhapKho" IS NULL))) AS "CoKhoanMuon",
         (EXISTS(SELECT 1 FROM ca_quay_thiet_bi p WHERE p."thietBiId"=t.id AND p."trangThaiMuonTra"='THAT_LAC') OR
          EXISTS(SELECT 1 FROM su_co_van_hanh s WHERE s."donViId"=d."donViId" AND s."nguyenNhan"='THAT_LAC' AND s."trangThai" IN ('MOI_BAO','DA_XAC_MINH','DANG_XU_LY') AND s."taiNguyen" @> jsonb_build_array(jsonb_build_object('Id',t.id,'Loai','THIET_BI')))) AS "ThatLac",
        EXISTS(SELECT 1 FROM su_co_bao_tri s WHERE s."thietBiId"=t.id AND s."trangThai"!='DA_KHAC_PHUC') AS "CoSuCo",
        (EXISTS(SELECT 1 FROM giu_cho_tai_nguyen g JOIN phien_quyet_dinh f ON f.id=g."phienId" JOIN ca_quay cg ON cg.id=f."caQuayId" WHERE g."taiNguyenId"=t.id AND g.loai='THIET_BI' AND g."donViId"=d."donViId" AND g."trangThai"='MO' AND f."trangThai"='MO' AND cg."trangThai" NOT IN ('DA_HUY','HOAN_THANH') AND g."hetHanLuc">${MocThoiGianSql(Ky.HienTai)} AND g."batDau"<${MocThoiGianSql(KetThuc)} AND g."ketThuc">${MocThoiGianSql(BatDau)}) OR EXISTS(SELECT 1 FROM ca_quay_thiet_bi p JOIN ca_quay c ON c.id=p."caQuayId" WHERE p."thietBiId"=t.id AND c."trangThai" IN ('DA_DUYET','DANG_DIEN_RA')
          AND COALESCE(p."hieuLucTu", ${KhoangHieuLuc.BatDau}) < ${MocThoiGianSql(KetThuc)}
          AND COALESCE(p."hieuLucDen", ${KhoangHieuLuc.KetThuc}) > ${MocThoiGianSql(BatDau)}
          AND p."trangThaiMuonTra"='CHO_XUAT_KHO')) AS "CoLich",
        EXISTS(SELECT 1 FROM ca_quay_thiet_bi p JOIN ca_quay c ON c.id=p."caQuayId" WHERE p."thietBiId"=t.id AND p."trangThaiMuonTra"='DA_XUAT_KHO' AND c."thoiGianKetThuc" < ${MocThoiGianSql(Ky.HienTai)}) AS "QuaHan"
      FROM thiet_bi t JOIN danh_muc_thiet_bi d ON d.id=t."danhMucId"
      LEFT JOIN kho k ON k.id=t."khoId" LEFT JOIN mau_thiet_bi m ON m.id=t."mauThietBiId"
      WHERE d."donViId"=${DonViId} AND t.id > ${SauId} ${Id ? Prisma.sql`AND t.id IN (${Prisma.join(Id.length ? Id : [""])})` : Prisma.empty}
      ORDER BY t.id LIMIT 500`);
    const GiuCho = await CoSoDuLieu.giuChoTaiNguyen.findMany({
      where: {
        DonViId,
        Loai: "THIET_BI",
        TaiNguyenId: { in: Lo.map((Muc) => Muc.Id) },
        TrangThai: "MO",
        HetHanLuc: { gt: Ky.HienTai },
        Phien: {
          TrangThai: "MO",
          Ca: { TrangThai: { notIn: ["DA_HUY", "HOAN_THANH"] } },
        },
      },
      select: {
        TaiNguyenId: true,
        BatDau: true,
        KetThuc: true,
        HetHanLuc: true,
      },
    });
    const Gio = (Moc: Date) =>
      Moc.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    KetQua.push(
      ...Lo.map((Muc) => {
        const TrangThai = XacDinhTrangThai(Muc, Ky);
        return {
          ...Muc,
          ...TrangThai,
          CanhBao: [
            ...TrangThai.CanhBao,
            ...GiuCho.filter((Dong) => Dong.TaiNguyenId === Muc.Id).map(
              (Dong) =>
                `Giữ chỗ để quyết định phương án đến ${Gio(Dong.HetHanLuc)}; khoảng sử dụng ${Gio(Dong.BatDau)} – ${Gio(Dong.KetThuc)}.`,
            ),
          ],
        };
      }),
    );
    if (Lo.length < 500) break;
    SauId = Lo[Lo.length - 1]!.Id;
  }
  return KetQua;
}
