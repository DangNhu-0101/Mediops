import {
  LoaiHanhDong,
  MucDoSuCo,
  TrangThaiCaQuay,
  TrangThaiSuCo,
} from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LayTrangThaiThietBi } from "./TrangThaiHienThiThietBiService.js";
import { LayKyThongKe, SchemaKyThongKe } from "./KyThongKeService.js";
import { DieuKienCaDuocXem, type PhamViThongKe } from "./ThongKeDuAnService.js";
import { KiemTraXungDotToanDien } from "./ThuatToanXungDotService.js";
import {
  LayNgayHienTaiVietNam,
  TaoKhoangNgayVietNam,
} from "./ThoiGianVietNamService.js";

const GioiHanCaQuayHienThi = 12;
const GioiHanSuCo = 5;
const GioiHanNhatKy = 5;

const ThuTuMucDo: Record<MucDoSuCo, number> = {
  NGHIEM_TRONG: 3,
  TRUNG_BINH: 2,
  NHE: 1,
};

const ThuTuTrangThaiSuCo: Record<TrangThaiSuCo, number> = {
  CHO_XU_LY: 2,
  DANG_SUA_CHUA: 1,
  DA_KHAC_PHUC: 0,
};

export async function LayDuLieuBangDieuKhien(ThamSo: {
  DonViId: string;
  ThoiDiem?: Date;
  PhamVi?: PhamViThongKe;
}) {
  const PhamVi = ThamSo.PhamVi ?? {
    NguoiDungId: "00000000-0000-4000-8000-000000000000",
    Quyen: [],
  };
  const XemThietBi = PhamVi.Quyen.includes("ThietBi.Xem");
  const XemSuCo = PhamVi.Quyen.includes("SuCo.Xem");
  const XemNhatKy = PhamVi.Quyen.includes("NhatKy.Xem");
  const XemXungDot = PhamVi.Quyen.includes("CaQuay.PhanCong");
  const Ngay = LayNgayHienTaiVietNam(ThamSo.ThoiDiem);
  const { TuNgay: TuNgay, DenNgay: DenNgay } = TaoKhoangNgayVietNam(Ngay);
  const PhamViCaQuay = {
    ...DieuKienCaDuocXem(ThamSo.DonViId, PhamVi),
    ThoiGianKetThuc: { gt: TuNgay },
    ThoiGianBatDau: { lt: DenNgay },
  };
  const PhamViThietBi = { DanhMuc: { DonViId: ThamSo.DonViId } };

  const [DanhSachCaQuay, ThongKeThietBi, DanhSachSuCo, HoatDongKho] =
    await Promise.all([
      CoSoDuLieu.caQuay.findMany({
        where: PhamViCaQuay,
        select: {
          Id: true,
          TieuDe: true,
          ThoiGianBatDau: true,
          ThoiGianKetThuc: true,
          TrangThai: true,
          GhiChuDiaDiem: true,
          ThoiGianChuanBiPhut: true,
          ThoiGianThuHoiPhut: true,
          PhongStudioId: true,
          NguoiPhuTrachId: true,
          PhongStudio: { select: { TenPhong: true, DiaDiem: true } },
          DuAn: { select: { TenDuAn: true } },
          NguoiPhuTrach: { select: { HoTen: true } },
          DanhSachThietBi: {
            select: { ThietBiId: true, TrangThaiMuonTra: true },
          },
          DanhSachNhanSu: { select: { NguoiDungId: true } },
        },
        orderBy: [{ ThoiGianBatDau: "asc" }, { Id: "asc" }],
      }),
      XemThietBi
        ? LayTrangThaiThietBi(
            ThamSo.DonViId,
            LayKyThongKe(SchemaKyThongKe.parse({}), ThamSo.ThoiDiem),
          )
        : Promise.resolve([]),
      CoSoDuLieu.suCoBaoTri.findMany({
        where: {
          ...(!XemSuCo ? { Id: { in: [] } } : {}),
          ThietBi: PhamViThietBi,
          TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC },
        },
        select: {
          Id: true,
          MucDo: true,
          TrangThai: true,
          NgayTao: true,
          ThietBi: { select: { TenThietBi: true } },
        },
        orderBy: { NgayTao: "desc" },
        take: 20,
      }),
      CoSoDuLieu.nhatKyMuonTra.findMany({
        where: {
          ...(!XemNhatKy ? { Id: { in: [] } } : {}),
          CaQuay: DieuKienCaDuocXem(ThamSo.DonViId, PhamVi),
          ThietBi: PhamViThietBi,
          LoaiHanhDong: { in: [LoaiHanhDong.XUAT_KHO, LoaiHanhDong.NHAP_KHO] },
        },
        select: {
          Id: true,
          ThoiGian: true,
          LoaiHanhDong: true,
          ThietBi: { select: { TenThietBi: true } },
          CaQuay: { select: { TieuDe: true } },
          NguoiThucHien: { select: { HoTen: true } },
          GiaoDichKho: { select: { Kho: { select: { TenKho: true } } } },
        },
        orderBy: [{ ThoiGian: "desc" }, { Id: "desc" }],
        take: GioiHanNhatKy,
      }),
    ]);

  const DanhSachSuCoUuTien = [...DanhSachSuCo]
    .sort(
      (A, B) =>
        ThuTuMucDo[B.MucDo] - ThuTuMucDo[A.MucDo] ||
        ThuTuTrangThaiSuCo[B.TrangThai] - ThuTuTrangThaiSuCo[A.TrangThai] ||
        B.NgayTao.getTime() - A.NgayTao.getTime(),
    )
    .slice(0, GioiHanSuCo);

  const CaQuayCanKiemTra = DanhSachCaQuay.filter(
    (CaQuay) =>
      !(
        [
          TrangThaiCaQuay.DA_HUY,
          TrangThaiCaQuay.HOAN_THANH,
        ] as TrangThaiCaQuay[]
      ).includes(CaQuay.TrangThai),
  );
  const XungDotTheoCaQuay = XemXungDot
    ? await Promise.all(
        CaQuayCanKiemTra.map(async (CaQuay) => {
          const KetQua = await KiemTraXungDotToanDien({
            DonViId: ThamSo.DonViId,
            CaQuayHienTaiId: CaQuay.Id,
            ThoiGianBatDau: CaQuay.ThoiGianBatDau,
            ThoiGianKetThuc: CaQuay.ThoiGianKetThuc,
            PhongStudioId: CaQuay.PhongStudioId,
            NguoiPhuTrachId: CaQuay.NguoiPhuTrachId,
            DanhSachThietBiId: CaQuay.DanhSachThietBi.map(
              (PhanCong) => PhanCong.ThietBiId,
            ),
            DanhSachNhanSuId: CaQuay.DanhSachNhanSu.map(
              (PhanCong) => PhanCong.NguoiDungId,
            ),
            ThoiGianChuanBiPhut: CaQuay.ThoiGianChuanBiPhut,
            ThoiGianThuHoiPhut: CaQuay.ThoiGianThuHoiPhut,
          });
          return { Id: CaQuay.Id, DanhSachXungDot: KetQua.DanhSachXungDot };
        }),
      )
    : [];
  const XungDotTheoId = new Map(
    XungDotTheoCaQuay.map((Muc) => [Muc.Id, Muc.DanhSachXungDot]),
  );
  const DanhSachXungDot = XungDotTheoCaQuay.filter(
    (Muc) => Muc.DanhSachXungDot.length > 0,
  );

  const DanhSachCaQuayHienThi = DanhSachCaQuay.slice(
    0,
    GioiHanCaQuayHienThi,
  ).map((CaQuay) => ({
    Id: CaQuay.Id,
    TieuDe: CaQuay.TieuDe,
    ThoiGianBatDau: CaQuay.ThoiGianBatDau,
    ThoiGianKetThuc: CaQuay.ThoiGianKetThuc,
    TrangThai: CaQuay.TrangThai,
    DuAn: CaQuay.DuAn.TenDuAn,
    Studio:
      CaQuay.PhongStudio?.TenPhong ??
      CaQuay.GhiChuDiaDiem ??
      "Chưa xác định địa điểm",
    NguoiPhuTrach: CaQuay.NguoiPhuTrach.HoTen,
    SoThietBi: CaQuay.DanhSachThietBi.length,
    SoThietBiChoXuat: CaQuay.DanhSachThietBi.filter(
      (PhanCong) => PhanCong.TrangThaiMuonTra === "CHO_XUAT_KHO",
    ).length,
    CoXungDot: Boolean(XungDotTheoId.get(CaQuay.Id)?.length),
  }));

  const CanXuLy = [
    ...DanhSachXungDot.slice(0, 3).map((Muc) => {
      const CaQuay = DanhSachCaQuay.find(
        (MucCaQuay) => MucCaQuay.Id === Muc.Id,
      )!;
      return {
        Loai: "XUNG_DOT" as const,
        Id: CaQuay.Id,
        TieuDe: `Ca quay “${CaQuay.TieuDe}” có xung đột cần xử lý`,
        MoTa: Muc.DanhSachXungDot[0]?.TenTaiNguyen ?? "Kiểm tra phân công",
        DuongDan: `/ca-quay/${CaQuay.Id}`,
      };
    }),
    ...DanhSachSuCoUuTien.slice(0, 3).map((SuCo) => ({
      Loai: "SU_CO" as const,
      Id: SuCo.Id,
      TieuDe: `${SuCo.ThietBi.TenThietBi} đang ${SuCo.TrangThai === "CHO_XU_LY" ? "chờ xử lý" : "được sửa chữa"}`,
      MoTa: "Xem sự cố và bảo trì",
      DuongDan: "/bao-tri",
    })),
    ...DanhSachCaQuayHienThi.filter(
      (CaQuay) =>
        ["DA_DUYET", "DANG_DIEN_RA"].includes(CaQuay.TrangThai) &&
        CaQuay.SoThietBiChoXuat > 0,
    )
      .slice(0, 2)
      .map((CaQuay) => ({
        Loai: "KHO" as const,
        Id: CaQuay.Id,
        TieuDe: `Ca quay “${CaQuay.TieuDe}” còn ${CaQuay.SoThietBiChoXuat} thiết bị chờ xuất kho`,
        MoTa: CaQuay.Studio,
        DuongDan: `/ca-quay/${CaQuay.Id}`,
      })),
  ];

  return {
    Ngay: Ngay,
    TongCaQuayHomNay: DanhSachCaQuay.length,
    TongXungDot: DanhSachXungDot.length,
    CoTheXemXungDot: XemXungDot,
    CoTheXemSuCo: XemSuCo,
    CoTheXemNhatKy: XemNhatKy,
    ThongKeThietBi: XemThietBi
      ? {
          TongSo: ThongKeThietBi.length,
          Ranh: ThongKeThietBi.filter((Muc) => Muc.TrangThaiHienThi === "RANH")
            .length,
          ChoSuDung: ThongKeThietBi.filter(
            (Muc) => Muc.TrangThaiHienThi === "CHO_SU_DUNG",
          ).length,
          DangSuDung: ThongKeThietBi.filter(
            (Muc) => Muc.TrangThaiHienThi === "DANG_SU_DUNG",
          ).length,
          BaoTri: ThongKeThietBi.filter(
            (Muc) => Muc.TrangThaiHienThi === "BAO_TRI",
          ).length,
          NgoaiLe: ThongKeThietBi.filter((Muc) => Muc.CoNgoaiLe).length,
        }
      : null,
    DanhSachCaQuay: DanhSachCaQuayHienThi,
    ConCaQuayKhac: Math.max(
      0,
      DanhSachCaQuay.length - DanhSachCaQuayHienThi.length,
    ),
    CanXuLy: CanXuLy,
    DanhSachSuCo: DanhSachSuCoUuTien,
    HoatDongKho: HoatDongKho,
  };
}
