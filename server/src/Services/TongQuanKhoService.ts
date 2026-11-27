import { CoSoDuLieu } from "../Config/Database.js";
import { LayChiTietKho } from "./KhoService.js";
import { LayTongKho, type LocKho } from "./ThongKeKhoService.js";
import { LayKyThongKe } from "./KyThongKeService.js";
import { DieuKienCaDuocXem, type PhamViThongKe } from "./ThongKeDuAnService.js";

export async function LayTongQuanKho(
  Id: string,
  DonViId: string,
  Loc: LocKho,
  PhamVi: PhamViThongKe,
) {
  const Kho = await LayChiTietKho(Id, DonViId);
  const Ky = LayKyThongKe(Loc);
  const GioiHanNgay = Ky.ToanBo ? {} : { gte: Ky.BatDau, lt: Ky.KetThuc };
  const WhereGiaoDich = {
    KhoId: Id,
    Kho: { DonViId },
    CaQuay: DieuKienCaDuocXem(DonViId, PhamVi),
    ThoiGian: GioiHanNgay,
    ...(Loc.LoaiHanhDong ? { LoaiHanhDong: Loc.LoaiHanhDong } : {}),
  };
  const WhereSuCo = {
    KhoId: Id,
    Kho: { DonViId },
    NgayTao: GioiHanNgay,
    ...(Loc.SuCoTrangThai ? { TrangThai: Loc.SuCoTrangThai } : {}),
  };
  const WhereCa = {
    AND: [
      DieuKienCaDuocXem(DonViId, PhamVi),
      { DanhSachThietBi: { some: { ThietBi: { KhoId: Id } } } },
      ...(Ky.ToanBo
        ? []
        : [
            {
              ThoiGianBatDau: { lt: Ky.KetThuc },
              ThoiGianKetThuc: { gt: Ky.BatDau },
            },
          ]),
    ],
  };
  const [TongKho, GiaoDich, TongGiaoDich, SuCo, TongSuCo, CacCa, TongCa] =
    await Promise.all([
      PhamVi.Quyen.includes("ThietBi.Xem")
        ? LayTongKho(
            DonViId,
            {
              ...Loc,
              Ky: "TOAN_BO",
              TuNgay: undefined,
              DenNgay: undefined,
              KhoId: Id,
            },
            PhamVi,
          )
        : null,
      PhamVi.Quyen.includes("NhatKy.Xem")
        ? CoSoDuLieu.giaoDichKho.findMany({
            where: WhereGiaoDich,
            select: {
              Id: true,
              LoaiHanhDong: true,
              ThoiGian: true,
              CaQuay: { select: { Id: true, TieuDe: true } },
              _count: { select: { DanhSachNhatKy: true } },
            },
            orderBy: [{ ThoiGian: "desc" }, { Id: "asc" }],
            skip: (Loc.Trang - 1) * Loc.KichThuoc,
            take: Loc.KichThuoc,
          })
        : [],
      PhamVi.Quyen.includes("NhatKy.Xem")
        ? CoSoDuLieu.giaoDichKho.count({ where: WhereGiaoDich })
        : null,
      PhamVi.Quyen.includes("SuCo.Xem")
        ? CoSoDuLieu.suCoBaoTri.findMany({
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
          })
        : [],
      PhamVi.Quyen.includes("SuCo.Xem")
        ? CoSoDuLieu.suCoBaoTri.count({ where: WhereSuCo })
        : null,
      CoSoDuLieu.caQuay.findMany({
        where: WhereCa,
        select: {
          Id: true,
          TieuDe: true,
          ThoiGianBatDau: true,
          DuAn: { select: { Id: true, TenDuAn: true } },
        },
        orderBy: [{ ThoiGianBatDau: "desc" }, { Id: "asc" }],
        skip: (Loc.Trang - 1) * Loc.KichThuoc,
        take: Loc.KichThuoc,
      }),
      CoSoDuLieu.caQuay.count({ where: WhereCa }),
    ]);
  return {
    ...Kho,
    _count: undefined,
    TongKho,
    GiaoDich,
    TongGiaoDich,
    SuCo,
    TongSuCo,
    CacCa,
    TongCa,
    Ky,
    Trang: Loc.Trang,
    KichThuoc: Loc.KichThuoc,
  };
}
