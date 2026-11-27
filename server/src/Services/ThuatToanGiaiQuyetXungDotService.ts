import { LayPhienGiuChoNoiBo } from "./NguCanhGiuChoService.js";
import { createHash } from "node:crypto";
import {
  LoaiTaiNguyen,
  type Prisma,
  TrangThaiCaQuay,
  TrangThaiStudio,
} from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { CapNhatCaQuayTrongGiaoDich } from "./CaQuayService.js";
import { ThucHienGiaoDichLich } from "./GiaoDichLichService.js";
import {
  LoiDuLieuKhongHopLe,
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "./LoiNghiepVuService.js";
import {
  TimThietBiThayThe,
  TaoNhanThongSo,
  NhanThongSo,
} from "./ThuatToanGoiYService.js";
import {
  DanhGiaYeuCauTaiNguyen,
  LayYeuCauCaQuay,
  LayTaiNguyenDoiChieu,
  type DanhGiaYeuCau,
  type TaiNguyenDoiChieu,
} from "./YeuCauTaiNguyenService.js";
import {
  type ChiTietXungDot,
  KiemTraXungDotToanDien,
} from "./ThuatToanXungDotService.js";

export type LoaiChienLuocGiaiQuyet =
  | "THAY_THIET_BI_NOI_BO"
  | "DOI_THOI_GIAN"
  | "DOI_STUDIO"
  | "DOI_NHAN_SU"
  | "DOI_NGUOI_PHU_TRACH"
  | "PHOI_HOP_THAY_DOI"
  | "THUE_THIET_BI_BEN_NGOAI"
  | "DIEU_CHINH_YEU_CAU_KY_THUAT"
  | "CHIA_LAI_CA_QUAY"
  | "CAN_NHAC_MUA_BO_SUNG"
  | "RA_SOAT_UU_TIEN"
  | "XU_LY_THU_CONG";

export type NhomPhuongAn =
  | "GIU_NGUYEN_LICH"
  | "DIEU_CHINH_THOI_GIAN"
  | "THAY_DOI_TAI_NGUYEN"
  | "THUE_NGOAI"
  | "CAN_XU_LY_THU_CONG";

export interface ThayDoiGiaiQuyet {
  ThietBiBoSung?: Array<{ Id: string; TenThietBi: string }>;
  ThoiGian?: { BatDau: Date; KetThuc: Date };
  Studio?: { TuId: string | null; DenId: string; TenStudio: string };
  ThietBi?: Array<{
    TuId: string;
    TenThietBiGoc: string;
    DenId?: string;
    TenThietBiMoi: string;
    Nguon: "NOI_BO" | "THUE_NGOAI";
    TinhTrangXacNhan?: "CAN_LIEN_HE";
    DiemTuongDong?: number;
  }>;
  NhanSu?: Array<{
    TuId: string;
    TenNhanSuGoc: string;
    DenId: string;
    TenNhanSuMoi: string;
    ChucDanhPhanCong: string;
  }>;
  NguoiPhuTrach?: {
    TuId: string;
    TenNguoiGoc: string;
    DenId: string;
    TenNguoiMoi: string;
  };
}

export interface PhuongAnGiaiQuyet {
  SoSanh?: Array<{
    TieuChi: string;
    DangCan: string;
    DeXuat: string;
    KetLuan: string;
  }>;
  ViTriDeXuat?: string;
  Id: string;
  LoaiChienLuoc: LoaiChienLuocGiaiQuyet;
  Nhom: NhomPhuongAn;
  TieuDe: string;
  GiaiThich: string;
  ThayDoi: ThayDoiGiaiQuyet;
  XungDotDaGiaiQuyet: string[];
  XungDotConLai: ChiTietXungDot[];
  KhaThi: "KHA_THI" | "CAN_XAC_NHAN" | "TU_VAN";
  ApDungDuoc: boolean;
  DanhSachDanhDoi: string[];
  ChiPhiBoSung: { SoTien: string | null; DonViTien: "VND"; Nhan: string };
  AnhHuongThoiGianPhut: number;
  DoDayDuDuLieu: "DAY_DU" | "MOT_PHAN" | "HAN_CHE";
  TieuChiXepHang: string[];
  ThuTuUuTien: number;
  DanhGiaYeuCau?: DanhGiaYeuCau;
}

export interface KetQuaGiaiQuyetXungDot {
  CaQuayId: string;
  MaPhienBan: string;
  DanhSachXungDot: ChiTietXungDot[];
  DanhSachPhuongAn: PhuongAnGiaiQuyet[];
  ThongBao: string;
}

type CaQuayPhanTich = Awaited<ReturnType<typeof LayCaQuayPhanTich>>;

function LaDoiTuong(GiaTri: unknown): GiaTri is Record<string, unknown> {
  return (
    typeof GiaTri === "object" && GiaTri !== null && !Array.isArray(GiaTri)
  );
}

function TaoMaBam(GiaTri: unknown) {
  return createHash("sha256").update(JSON.stringify(GiaTri)).digest("hex");
}

function TaoKhoaXungDot(XungDot: ChiTietXungDot) {
  return [
    XungDot.LoaiTaiNguyen,
    XungDot.TaiNguyenId,
    XungDot.LoaiXungDot,
    XungDot.CaQuayBiTrung?.Id ?? XungDot.KhoangKhongKhaDung?.Id ?? "",
  ].join(":");
}

function TaoIdPhuongAn(
  LoaiChienLuoc: LoaiChienLuocGiaiQuyet,
  ThayDoi: ThayDoiGiaiQuyet,
) {
  return `${LoaiChienLuoc.toLocaleLowerCase("vi")}-${TaoMaBam(ThayDoi).slice(0, 16)}`;
}

async function LayCaQuayPhanTich(
  CaQuayId: string,
  DonViId: string,
  Db: Prisma.TransactionClient,
) {
  const CaQuay = await Db.caQuay.findFirst({
    where: { Id: CaQuayId, DuAn: { DonViId: DonViId } },
    include: {
      DuAn: { select: { Id: true, DonViId: true } },
      PhongStudio: true,
      NguoiPhuTrach: {
        select: {
          Id: true,
          HoTen: true,
          ChucDanhId: true,
          TrinhDo: true,
        },
      },
      DanhSachThietBi: {
        where: { HieuLucDen: null },
        include: { ThietBi: { include: { DanhMuc: true } } },
      },
      DanhSachNhanSu: {
        where: { HieuLucDen: null },
        include: {
          NguoiDung: {
            select: {
              Id: true,
              HoTen: true,
              ChucDanhId: true,
              TrinhDo: true,
            },
          },
        },
      },
    },
  });
  if (!CaQuay) throw new LoiKhongTimThay("Không tìm thấy ca quay");
  return {
    ...CaQuay,
    CacYeuCauTaiNguyen: await LayYeuCauCaQuay(CaQuayId, DonViId, Db),
  };
}

function TaoThamSoKiemTra(
  CaQuay: CaQuayPhanTich,
  ThayDoi: ThayDoiGiaiQuyet = {},
) {
  const ThayTheThietBi = new Map(
    (ThayDoi.ThietBi ?? [])
      .filter((Muc) => Muc.Nguon === "NOI_BO" && Muc.DenId)
      .map((Muc) => [Muc.TuId, Muc.DenId as string]),
  );
  const ThietBiThueNgoai = new Set(
    (ThayDoi.ThietBi ?? [])
      .filter((Muc) => Muc.Nguon === "THUE_NGOAI")
      .map((Muc) => Muc.TuId),
  );
  const ThayTheNhanSu = new Map(
    (ThayDoi.NhanSu ?? []).map((Muc) => [Muc.TuId, Muc.DenId]),
  );
  return {
    DonViId: CaQuay.DuAn.DonViId,
    ThoiGianBatDau: ThayDoi.ThoiGian?.BatDau ?? CaQuay.ThoiGianBatDau,
    ThoiGianKetThuc: ThayDoi.ThoiGian?.KetThuc ?? CaQuay.ThoiGianKetThuc,
    PhongStudioId: ThayDoi.Studio?.DenId ?? CaQuay.PhongStudioId,
    NguoiPhuTrachId: ThayDoi.NguoiPhuTrach?.DenId ?? CaQuay.NguoiPhuTrachId,
    DanhSachThietBiId: [
      ...(ThayDoi.ThietBiBoSung ?? []).map((Muc) => Muc.Id),
      ...CaQuay.DanhSachThietBi.flatMap((PhanCong) => {
        if (ThietBiThueNgoai.has(PhanCong.ThietBiId)) return [];
        return [ThayTheThietBi.get(PhanCong.ThietBiId) ?? PhanCong.ThietBiId];
      }),
    ],
    DanhSachNhanSuId: CaQuay.DanhSachNhanSu.map(
      (PhanCong) =>
        ThayTheNhanSu.get(PhanCong.NguoiDungId) ?? PhanCong.NguoiDungId,
    ),
    CaQuayHienTaiId: CaQuay.Id,
    ThoiGianChuanBiPhut: CaQuay.ThoiGianChuanBiPhut,
    ThoiGianThuHoiPhut: CaQuay.ThoiGianThuHoiPhut,
  };
}

async function DanhGiaThayDoi(
  CaQuay: CaQuayPhanTich,
  XungDotBanDau: ChiTietXungDot[],
  ThayDoi: ThayDoiGiaiQuyet,
  Db: Prisma.TransactionClient,
) {
  const KetQua = await KiemTraXungDotToanDien(
    TaoThamSoKiemTra(CaQuay, ThayDoi),
    Db,
  );
  const KhoaConLai = new Set(KetQua.DanhSachXungDot.map(TaoKhoaXungDot));
  const DanhGiaYeuCau = await DanhGiaYeuCauPhuongAn(CaQuay, ThayDoi, Db);
  return {
    DanhGiaYeuCau: DanhGiaYeuCau,
    XungDotDaGiaiQuyet: XungDotBanDau.filter(
      (XungDot) => !KhoaConLai.has(TaoKhoaXungDot(XungDot)),
    ).map(TaoKhoaXungDot),
    XungDotConLai: KetQua.DanhSachXungDot,
  };
}

async function DanhGiaYeuCauPhuongAn(
  CaQuay: CaQuayPhanTich,
  ThayDoi: ThayDoiGiaiQuyet,
  Db: Prisma.TransactionClient,
) {
  if (!CaQuay.CacYeuCauTaiNguyen.length) return DanhGiaYeuCauTaiNguyen([], []);
  const ThamSo = TaoThamSoKiemTra(CaQuay, ThayDoi);
  const TaiNguyen = await LayTaiNguyenDoiChieu(
    {
      DonViId: CaQuay.DuAn.DonViId,
      DanhSachThietBiId: ThamSo.DanhSachThietBiId,
      DanhSachNhanSuId: [ThamSo.NguoiPhuTrachId, ...ThamSo.DanhSachNhanSuId],
      PhongStudioId: ThamSo.PhongStudioId,
    },
    Db,
  );
  return DanhGiaYeuCauTaiNguyen(CaQuay.CacYeuCauTaiNguyen, TaiNguyen);
}

function TaoPhuongAn(ThamSo: {
  LoaiChienLuoc: LoaiChienLuocGiaiQuyet;
  Nhom: NhomPhuongAn;
  TieuDe: string;
  GiaiThich: string;
  ThayDoi: ThayDoiGiaiQuyet;
  DanhGia: {
    XungDotDaGiaiQuyet: string[];
    XungDotConLai: ChiTietXungDot[];
    DanhGiaYeuCau?: DanhGiaYeuCau;
  };
  KhaThi?: PhuongAnGiaiQuyet["KhaThi"];
  ApDungDuoc?: boolean;
  DanhSachDanhDoi?: string[];
  ChiPhi?: string | null;
  NhanChiPhi?: string;
  AnhHuongThoiGianPhut?: number;
  DoDayDuDuLieu?: PhuongAnGiaiQuyet["DoDayDuDuLieu"];
  TieuChiXepHang: string[];
  DiemNen: number;
}): PhuongAnGiaiQuyet & { DiemXepHang: number } {
  const SoThayDoi =
    (ThamSo.ThayDoi.Studio ? 1 : 0) +
    (ThamSo.ThayDoi.ThoiGian ? 1 : 0) +
    (ThamSo.ThayDoi.NguoiPhuTrach ? 1 : 0) +
    (ThamSo.ThayDoi.ThietBi?.length ?? 0) +
    (ThamSo.ThayDoi.NhanSu?.length ?? 0);
  const DiemXepHang =
    (ThamSo.DanhGia.XungDotConLai.length === 0 ? 1000 : 0) +
    ThamSo.DiemNen -
    Math.abs(ThamSo.AnhHuongThoiGianPhut ?? 0) / 30 -
    Math.max(0, SoThayDoi - 1) * 8;
  return {
    Id: TaoIdPhuongAn(ThamSo.LoaiChienLuoc, ThamSo.ThayDoi),
    LoaiChienLuoc: ThamSo.LoaiChienLuoc,
    Nhom: ThamSo.Nhom,
    TieuDe: ThamSo.TieuDe,
    GiaiThich: ThamSo.GiaiThich,
    ThayDoi: ThamSo.ThayDoi,
    ...ThamSo.DanhGia,
    KhaThi: ThamSo.KhaThi ?? "KHA_THI",
    ApDungDuoc: ThamSo.ApDungDuoc ?? true,
    DanhSachDanhDoi: ThamSo.DanhSachDanhDoi ?? [],
    ChiPhiBoSung: {
      SoTien: ThamSo.ChiPhi ?? null,
      DonViTien: "VND",
      Nhan:
        ThamSo.NhanChiPhi ??
        (ThamSo.ChiPhi ? "Chi phí đã lưu" : "Không phát sinh dữ liệu chi phí"),
    },
    AnhHuongThoiGianPhut: ThamSo.AnhHuongThoiGianPhut ?? 0,
    DoDayDuDuLieu: ThamSo.DoDayDuDuLieu ?? "DAY_DU",
    TieuChiXepHang: ThamSo.TieuChiXepHang,
    ThuTuUuTien: 0,
    DiemXepHang: DiemXepHang,
  };
}

function TinhPhutLech(CaQuay: CaQuayPhanTich, BatDauMoi: Date) {
  return Math.round(
    (BatDauMoi.getTime() - CaQuay.ThoiGianBatDau.getTime()) / 60_000,
  );
}

async function TaoPhuongAnDoiThoiGian(
  CaQuay: CaQuayPhanTich,
  XungDot: ChiTietXungDot[],
  Db: Prisma.TransactionClient,
) {
  if (!CaQuay.CoTheDoiLich) return [];
  const ThoiLuong =
    CaQuay.ThoiGianKetThuc.getTime() - CaQuay.ThoiGianBatDau.getTime();
  const PHUT = 60_000;
  const KiemTraQcTheoThietBi = new Map(
    CaQuay.DanhSachThietBi.map((Muc) => [
      Muc.ThietBiId,
      Muc.ThietBi.ThoiGianKiemTraSauSuDungPhut,
    ]),
  );
  // Mốc được suy từ khoảng HIỆU LỰC của tài nguyên đang chặn, không phải giờ quay:
  //  - ca mới đứng sau:  S' − P_n ≥ E_c + R_c + Q   ⇒  S' = E_c + R_c + Q + P_n
  //  - ca mới đứng trước: E' + R_n + Q ≤ S_c − P_c   ⇒  E' = S_c − P_c − R_n − Q
  // Q là thời gian kiểm tra sau sử dụng, chỉ khác 0 khi tài nguyên chặn là thiết bị.
  const CacMoc = new Map<number, { BatDau: Date; KetThuc: Date }>();
  const ThemMocSau = (BatDauSom: number) =>
    CacMoc.set(BatDauSom, {
      BatDau: new Date(BatDauSom),
      KetThuc: new Date(BatDauSom + ThoiLuong),
    });
  const ThemMocTruoc = (KetThucMuon: number) =>
    CacMoc.set(KetThucMuon - ThoiLuong, {
      BatDau: new Date(KetThucMuon - ThoiLuong),
      KetThuc: new Date(KetThucMuon),
    });
  const CacMocSau: number[] = [];
  const CacMocTruoc: number[] = [];
  for (const Muc of XungDot) {
    const Q =
      Muc.LoaiTaiNguyen === LoaiTaiNguyen.THIET_BI
        ? (KiemTraQcTheoThietBi.get(Muc.TaiNguyenId) ?? 0)
        : 0;
    let BatDauChan: number | undefined;
    let KetThucChan: number | undefined;
    if (Muc.CaQuayBiTrung) {
      BatDauChan =
        Muc.CaQuayBiTrung.ThoiGianBatDau.getTime() -
        Muc.CaQuayBiTrung.ThoiGianChuanBiPhut * PHUT;
      KetThucChan =
        Muc.CaQuayBiTrung.ThoiGianKetThuc.getTime() +
        Muc.CaQuayBiTrung.ThoiGianThuHoiPhut * PHUT;
    } else if (Muc.KhoangKhongKhaDung) {
      BatDauChan = Muc.KhoangKhongKhaDung.BatDau.getTime();
      KetThucChan = Muc.KhoangKhongKhaDung.KetThuc.getTime();
    }
    if (KetThucChan !== undefined)
      CacMocSau.push(KetThucChan + (Q + CaQuay.ThoiGianChuanBiPhut) * PHUT);
    if (BatDauChan !== undefined)
      CacMocTruoc.push(BatDauChan - (Q + CaQuay.ThoiGianThuHoiPhut) * PHUT);
  }
  for (const Moc of CacMocSau) ThemMocSau(Moc);
  for (const Moc of CacMocTruoc) ThemMocTruoc(Moc);
  // Khi nhiều tài nguyên cùng chặn, mốc đúng là mốc xa nhất của cả nhóm.
  if (CacMocSau.length > 1) ThemMocSau(Math.max(...CacMocSau));
  if (CacMocTruoc.length > 1) ThemMocTruoc(Math.min(...CacMocTruoc));
  const KetQua = [];
  for (const Moc of [...CacMoc.values()].sort(
    (A, B) => A.BatDau.getTime() - B.BatDau.getTime(),
  )) {
    if (
      (CaQuay.ThoiGianBatDauSomNhat &&
        Moc.BatDau < CaQuay.ThoiGianBatDauSomNhat) ||
      (CaQuay.ThoiGianKetThucMuonNhat &&
        Moc.KetThuc > CaQuay.ThoiGianKetThucMuonNhat)
    )
      continue;
    const ThayDoi = { ThoiGian: Moc };
    const DanhGia = await DanhGiaThayDoi(CaQuay, XungDot, ThayDoi, Db);
    if (DanhGia.XungDotConLai.length) continue;
    const Lech = TinhPhutLech(CaQuay, Moc.BatDau);
    KetQua.push(
      TaoPhuongAn({
        LoaiChienLuoc: "DOI_THOI_GIAN",
        Nhom: "DIEU_CHINH_THOI_GIAN",
        TieuDe:
          Lech > 0
            ? `Lùi ca quay ${Lech} phút`
            : `Đưa ca quay sớm ${Math.abs(Lech)} phút`,
        GiaiThich:
          "Khoảng thời gian này được suy ra từ mốc kết thúc hoặc bắt đầu của tài nguyên đang chặn và đã kiểm tra lại toàn bộ Studio, thiết bị, nhân sự và người phụ trách ca.",
        ThayDoi: ThayDoi,
        DanhGia: DanhGia,
        AnhHuongThoiGianPhut: Lech,
        DanhSachDanhDoi: ["Thay đổi giờ làm việc của toàn bộ ê-kíp."],
        TieuChiXepHang: [
          "Giữ nguyên toàn bộ tài nguyên",
          "Nằm trong giới hạn đổi lịch",
          "Không tạo xung đột mới",
          `Mức ưu tiên hiện tại ${CaQuay.MucDoUuTien}/100; ca ưu tiên cao bị phạt khi phải đổi giờ`,
        ],
        DiemNen: 160 - CaQuay.MucDoUuTien / 5,
      }),
    );
    if (KetQua.length >= 3) break;
  }
  return KetQua;
}

async function TaoPhuongAnThayThietBi(
  CaQuay: CaQuayPhanTich,
  XungDot: ChiTietXungDot[],
  Db: Prisma.TransactionClient,
  ChoXacNhanGiaoNhan = false,
) {
  const CacId = [
    ...new Set(
      XungDot.filter((Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.THIET_BI).map(
        (Muc) => Muc.TaiNguyenId,
      ),
    ),
  ];
  const PhuongAn = [];
  const LuaChonHangDau: NonNullable<ThayDoiGiaiQuyet["ThietBi"]> = [];
  for (const ThietBiId of CacId) {
    const Goc = CaQuay.DanhSachThietBi.find(
      (Muc) => Muc.ThietBiId === ThietBiId,
    )?.ThietBi;
    if (!Goc) continue;
    const GoiY = await TimThietBiThayThe(
      {
        DonViId: CaQuay.DuAn.DonViId,
        ThietBiGocId: ThietBiId,
        CaQuayId: CaQuay.Id,
        ThoiGianBatDau: CaQuay.ThoiGianBatDau,
        ThoiGianKetThuc: CaQuay.ThoiGianKetThuc,
        ThoiGianChuanBiPhut: CaQuay.ThoiGianChuanBiPhut,
      },
      Db,
    );
    for (const UngVien of GoiY.slice(0, 3)) {
      const KhacViTriKho = Boolean(
        Goc.ViTriKho &&
        UngVien.ThietBi.ViTriKho &&
        Goc.ViTriKho !== UngVien.ThietBi.ViTriKho,
      );
      const CanBoSungTrungGian =
        UngVien.TuongThichKyThuat.ThietBiTrungGian.some(
          (Muc) =>
            !CaQuay.DanhSachThietBi.some((Cu) => Cu.ThietBiId === Muc.Id),
        );
      const ThayDoi = {
        ThietBiBoSung: UngVien.TuongThichKyThuat.ThietBiTrungGian.filter(
          (Muc) =>
            !CaQuay.DanhSachThietBi.some((Cu) => Cu.ThietBiId === Muc.Id),
        ).map((Muc) => ({ Id: Muc.Id, TenThietBi: Muc.TenThietBi })),
        ThietBi: [
          {
            TuId: ThietBiId,
            TenThietBiGoc: `${Goc.TenThietBi} · ${Goc.MaQR}`,
            DenId: UngVien.ThietBi.Id,
            TenThietBiMoi: `${UngVien.ThietBi.TenThietBi} · ${UngVien.ThietBi.MaQR}`,
            Nguon: "NOI_BO" as const,
            DiemTuongDong: UngVien.DiemTuongDong,
          },
        ],
      };
      const DanhGia = await DanhGiaThayDoi(CaQuay, XungDot, ThayDoi, Db);
      PhuongAn.push(
        TaoPhuongAn({
          LoaiChienLuoc: "THAY_THIET_BI_NOI_BO",
          Nhom: "GIU_NGUYEN_LICH",
          TieuDe: `Thay ${Goc.TenThietBi} bằng ${UngVien.ThietBi.TenThietBi}`,
          GiaiThich: `Giữ nguyên lịch. ${UngVien.LyDoGoiY}`,
          ThayDoi: ThayDoi,
          DanhGia: DanhGia,
          DanhSachDanhDoi: UngVien.ThongSoKhacBiet.slice(0, 3)
            .map((Muc) => `Khác biệt ở ${TaoNhanThongSo(Muc.TenThongSo)}.`)
            .concat(
              KhacViTriKho
                ? [
                    `Thiết bị ở ${UngVien.ThietBi.ViTriKho}; chưa có dữ liệu thời gian điều chuyển từ ${Goc.ViTriKho}.`,
                  ]
                : [],
            ),
          KhaThi:
            KhacViTriKho || CanBoSungTrungGian ? "CAN_XAC_NHAN" : "KHA_THI",
          ApDungDuoc: !KhacViTriKho || ChoXacNhanGiaoNhan,
          DoDayDuDuLieu: KhacViTriKho ? "MOT_PHAN" : "DAY_DU",
          TieuChiXepHang: [
            "Giữ nguyên lịch",
            "Ưu tiên nguồn lực nội bộ",
            `Tương đồng kỹ thuật ${UngVien.DiemTuongDong}%`,
            ...(KhacViTriKho
              ? ["Cần xác nhận thời gian điều chuyển giữa các vị trí kho"]
              : []),
          ],
          DiemNen: 180 + UngVien.DiemTuongDong / 10,
        }),
      );
      const The = PhuongAn[PhuongAn.length - 1];
      if (The) {
        const HienThi = (GiaTri: unknown): string =>
          typeof GiaTri === "boolean"
            ? GiaTri
              ? "Có"
              : "Không"
            : typeof GiaTri === "string" || typeof GiaTri === "number"
              ? String(GiaTri)
              : Array.isArray(GiaTri) &&
                  GiaTri.every(
                    (Muc) => typeof Muc === "string" || typeof Muc === "number",
                  )
                ? GiaTri.join(", ")
                : "Chưa đủ dữ liệu";
        The.SoSanh = [
          ...UngVien.ThongSoTuongDong,
          ...UngVien.ThongSoKhacBiet,
          ...UngVien.ThongSoThieu,
        ]
          .filter((Muc) => !!NhanThongSo[Muc.TenThongSo])
          .map((Muc) => ({
            TieuChi: NhanThongSo[Muc.TenThongSo]!,
            DangCan: HienThi(Muc.GiaTriGoc),
            DeXuat: HienThi(Muc.GiaTriUngVien),
            KetLuan:
              Muc.GiaTriUngVien === undefined
                ? "Chưa đủ dữ liệu"
                : Muc.MucTuongDong === 100
                  ? "Đạt yêu cầu"
                  : "Khác nhưng đáp ứng",
          }));
        The.ViTriDeXuat =
          UngVien.ThietBi.ViTriKho ?? "Cần xác nhận vị trí bàn giao";
      }
    }
    const DauTien = GoiY.find(
      (Muc) => !LuaChonHangDau.some((Cu) => Cu.DenId === Muc.ThietBi.Id),
    );
    const DauTienCungViTri = Boolean(
      DauTien &&
      (!Goc.ViTriKho ||
        !DauTien.ThietBi.ViTriKho ||
        Goc.ViTriKho === DauTien.ThietBi.ViTriKho),
    );
    if (
      DauTien &&
      (DauTienCungViTri || ChoXacNhanGiaoNhan) &&
      DauTien.TuongThichKyThuat.ThietBiTrungGian.every((Muc) =>
        CaQuay.DanhSachThietBi.some((Cu) => Cu.ThietBiId === Muc.Id),
      )
    )
      LuaChonHangDau.push({
        TuId: ThietBiId,
        TenThietBiGoc: Goc.TenThietBi,
        DenId: DauTien.ThietBi.Id,
        TenThietBiMoi: DauTien.ThietBi.TenThietBi,
        Nguon: "NOI_BO",
        DiemTuongDong: DauTien.DiemTuongDong,
      });
  }
  if (LuaChonHangDau.length > 1) {
    const ThayDoi = { ThietBi: LuaChonHangDau };
    const DanhGia = await DanhGiaThayDoi(CaQuay, XungDot, ThayDoi, Db);
    PhuongAn.push(
      TaoPhuongAn({
        LoaiChienLuoc: "THAY_THIET_BI_NOI_BO",
        Nhom: "GIU_NGUYEN_LICH",
        TieuDe: `Thay đồng thời ${LuaChonHangDau.length} thiết bị`,
        GiaiThich:
          "Dùng các ứng viên nội bộ có thứ hạng cao nhất để xử lý đồng thời nhiều thiếu hụt thiết bị.",
        ThayDoi: ThayDoi,
        DanhGia: DanhGia,
        DanhSachDanhDoi: ["Cần kiểm tra cấu hình tổng thể trước khi chốt."],
        TieuChiXepHang: [
          "Giữ nguyên lịch",
          "Giải quyết đồng thời nhiều thiết bị",
          "Ưu tiên nguồn lực nội bộ",
        ],
        DiemNen: 175,
      }),
    );
  }
  return { PhuongAn: PhuongAn, LuaChonHangDau: LuaChonHangDau };
}

function TinhMucPhuHopStudio(
  Goc: CaQuayPhanTich["PhongStudio"],
  UngVien: { SucChua: number | null; KhaNang: unknown },
) {
  let Diem = 0;
  if (!Goc?.SucChua || !UngVien.SucChua || UngVien.SucChua >= Goc.SucChua)
    Diem += 60;
  const KhaNangGoc = Goc?.KhaNang;
  const KhaNangUngVien = UngVien.KhaNang;
  if (LaDoiTuong(KhaNangGoc) && LaDoiTuong(KhaNangUngVien)) {
    const KhoaGoc = Object.keys(KhaNangGoc);
    const Trung = KhoaGoc.filter(
      (Khoa) =>
        JSON.stringify(KhaNangGoc[Khoa]) ===
        JSON.stringify(KhaNangUngVien[Khoa]),
    ).length;
    Diem += KhoaGoc.length ? Math.round((Trung / KhoaGoc.length) * 40) : 20;
  } else Diem += 20;
  return Diem;
}

async function TaoPhuongAnDoiStudio(
  CaQuay: CaQuayPhanTich,
  XungDot: ChiTietXungDot[],
  Db: Prisma.TransactionClient,
) {
  if (!XungDot.some((Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.STUDIO))
    return { PhuongAn: [], LuaChon: undefined };
  const DanhSach = await Db.phongStudio.findMany({
    where: {
      DonViId: CaQuay.DuAn.DonViId,
      Id: { not: CaQuay.PhongStudioId ?? undefined },
      TrangThai: TrangThaiStudio.SAN_SANG,
    },
  });
  const YeuCauStudio = CaQuay.CacYeuCauTaiNguyen.filter(
    (Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.STUDIO,
  );
  const UngVien = DanhSach.map((Studio) => ({
    Studio: Studio,
    Diem: TinhMucPhuHopStudio(CaQuay.PhongStudio, Studio),
    DanhGiaYeuCau: DanhGiaYeuCauTaiNguyen(YeuCauStudio, [
      {
        Id: Studio.Id,
        LoaiTaiNguyen: LoaiTaiNguyen.STUDIO,
        ThongSo: {
          ...(LaDoiTuong(Studio.KhaNang) ? Studio.KhaNang : {}),
          sucChua: Studio.SucChua,
        },
      },
    ]),
  }))
    .filter(
      (Muc) =>
        Muc.DanhGiaYeuCau.DapUngBatBuoc &&
        (YeuCauStudio.length || Muc.Diem >= 60),
    )
    .sort(
      (A, B) =>
        B.DanhGiaYeuCau.DiemUuTien - A.DanhGiaYeuCau.DiemUuTien ||
        B.Diem - A.Diem ||
        A.Studio.TenPhong.localeCompare(B.Studio.TenPhong, "vi") ||
        A.Studio.Id.localeCompare(B.Studio.Id),
    );
  const PhuongAn = [];
  for (const Muc of UngVien.slice(0, 3)) {
    const ThayDoi = {
      Studio: {
        TuId: CaQuay.PhongStudioId,
        DenId: Muc.Studio.Id,
        TenStudio: Muc.Studio.TenPhong,
      },
    };
    const DanhGia = await DanhGiaThayDoi(CaQuay, XungDot, ThayDoi, Db);
    PhuongAn.push(
      TaoPhuongAn({
        LoaiChienLuoc: "DOI_STUDIO",
        Nhom: "THAY_DOI_TAI_NGUYEN",
        TieuDe: `Chuyển sang ${Muc.Studio.TenPhong}`,
        GiaiThich:
          "Studio thuộc cùng đơn vị, đang sẵn sàng và đáp ứng các tiêu chí sức chứa/khả năng có dữ liệu.",
        ThayDoi: ThayDoi,
        DanhGia: DanhGia,
        DanhSachDanhDoi: [
          "Cần xác nhận lại bố trí trường quay và hậu cần tại Studio mới.",
        ],
        DoDayDuDuLieu:
          CaQuay.PhongStudio?.KhaNang && Muc.Studio.KhaNang
            ? "DAY_DU"
            : "MOT_PHAN",
        TieuChiXepHang: [
          "Giữ nguyên lịch",
          "Studio nội bộ",
          `Mức phù hợp dữ liệu ${Muc.Diem}%`,
        ],
        DiemNen: 150 + Muc.Diem / 10,
      }),
    );
  }
  return { PhuongAn: PhuongAn, LuaChon: UngVien[0]?.Studio };
}

// Ứng viên thay thế luôn cùng chức danh với người bị thay, kể cả người phụ trách ca.
async function TimNguoiThayThe(
  CaQuay: CaQuayPhanTich,
  NguoiGocId: string,
  Db: Prisma.TransactionClient,
) {
  const NguoiGoc = [
    CaQuay.NguoiPhuTrach,
    ...CaQuay.DanhSachNhanSu.map((Muc) => Muc.NguoiDung),
  ].find((Nguoi) => Nguoi.Id === NguoiGocId);
  if (!NguoiGoc?.ChucDanhId) return [];
  const YeuCauNhanSu = CaQuay.CacYeuCauTaiNguyen.filter(
    (Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.NHAN_SU,
  );
  const DaPhanCong = [
    CaQuay.NguoiPhuTrachId,
    ...CaQuay.DanhSachNhanSu.map((Muc) => Muc.NguoiDungId),
  ];
  const DanhSach = await Db.nguoiDung.findMany({
    where: {
      DonViId: CaQuay.DuAn.DonViId,
      Id: { notIn: DaPhanCong },
      ChucDanhId: NguoiGoc.ChucDanhId,
    },
    select: { Id: true, HoTen: true, ChucDanhId: true, TrinhDo: true },
  });
  const NhanSuGiuLai: TaiNguyenDoiChieu[] = [
    CaQuay.NguoiPhuTrach,
    ...CaQuay.DanhSachNhanSu.map((Muc) => Muc.NguoiDung),
  ]
    .filter((Muc) => Muc.Id !== NguoiGocId)
    .map((Muc) => ({
      Id: Muc.Id,
      LoaiTaiNguyen: LoaiTaiNguyen.NHAN_SU,
      ThongSo: {},
      ChucDanhId: Muc.ChucDanhId,
      TrinhDo: Muc.TrinhDo,
    }));
  const KhaDung = await KiemTraXungDotToanDien(
    {
      ...TaoThamSoKiemTra(CaQuay),
      PhongStudioId: null,
      NguoiPhuTrachId: undefined,
      DanhSachThietBiId: [],
      DanhSachNhanSuId: DanhSach.map((Muc) => Muc.Id),
    },
    Db,
  );
  const KhongKhaDung = new Set(
    KhaDung.DanhSachXungDot.map((Muc) => Muc.TaiNguyenId),
  );
  return DanhSach.map((Nguoi) => ({
    Nguoi: Nguoi,
    DanhGiaYeuCau: DanhGiaYeuCauTaiNguyen(YeuCauNhanSu, [
      ...NhanSuGiuLai,
      {
        Id: Nguoi.Id,
        LoaiTaiNguyen: LoaiTaiNguyen.NHAN_SU,
        ThongSo: {},
        ChucDanhId: Nguoi.ChucDanhId,
        TrinhDo: Nguoi.TrinhDo,
      },
    ]),
    // Mức trình độ của ứng viên so với người gốc, tối đa 100%.
    DiemTrinhDo: NguoiGoc.TrinhDo
      ? Math.round(
          (Math.min(Nguoi.TrinhDo ?? 0, NguoiGoc.TrinhDo) / NguoiGoc.TrinhDo) *
            100,
        )
      : 60,
  }))
    .filter(
      (Muc) =>
        Muc.DanhGiaYeuCau.DapUngBatBuoc && !KhongKhaDung.has(Muc.Nguoi.Id),
    )
    .sort(
      (A, B) =>
        B.DanhGiaYeuCau.DiemUuTien - A.DanhGiaYeuCau.DiemUuTien ||
        B.DiemTrinhDo - A.DiemTrinhDo ||
        A.Nguoi.HoTen.localeCompare(B.Nguoi.HoTen, "vi") ||
        A.Nguoi.Id.localeCompare(B.Nguoi.Id),
    );
}

async function TaoPhuongAnDoiNguoi(
  CaQuay: CaQuayPhanTich,
  XungDot: ChiTietXungDot[],
  Db: Prisma.TransactionClient,
) {
  const CacNguoi = [
    ...new Map(
      XungDot.filter((Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.NHAN_SU).map(
        (Muc) => [Muc.TaiNguyenId, Muc],
      ),
    ).values(),
  ];
  const PhuongAn = [];
  const ThayDoiHangDau: ThayDoiGiaiQuyet = {};
  for (const Muc of CacNguoi) {
    // Chỉ quyết định nơi ghi thay đổi; điều kiện ứng viên giống mọi nhân sự khác.
    const LaNguoiPhuTrach = Muc.TaiNguyenId === CaQuay.NguoiPhuTrachId;
    const DanhSach = await TimNguoiThayThe(CaQuay, Muc.TaiNguyenId, Db);
    const ChucDanhPhanCong = CaQuay.DanhSachNhanSu.find(
      (PhanCong) => PhanCong.NguoiDungId === Muc.TaiNguyenId,
    )?.ChucDanhPhanCong;
    for (const UngVien of DanhSach.slice(0, 3)) {
      const ThayDoi: ThayDoiGiaiQuyet = LaNguoiPhuTrach
        ? {
            NguoiPhuTrach: {
              TuId: Muc.TaiNguyenId,
              TenNguoiGoc: Muc.TenTaiNguyen,
              DenId: UngVien.Nguoi.Id,
              TenNguoiMoi: UngVien.Nguoi.HoTen,
            },
          }
        : {
            NhanSu: [
              {
                TuId: Muc.TaiNguyenId,
                TenNhanSuGoc: Muc.TenTaiNguyen,
                DenId: UngVien.Nguoi.Id,
                TenNhanSuMoi: UngVien.Nguoi.HoTen,
                ChucDanhPhanCong: ChucDanhPhanCong ?? "Thành viên ê-kíp",
              },
            ],
          };
      const DanhGia = await DanhGiaThayDoi(CaQuay, XungDot, ThayDoi, Db);
      PhuongAn.push(
        TaoPhuongAn({
          LoaiChienLuoc: LaNguoiPhuTrach
            ? "DOI_NGUOI_PHU_TRACH"
            : "DOI_NHAN_SU",
          Nhom: "THAY_DOI_TAI_NGUYEN",
          TieuDe: `Thay ${Muc.TenTaiNguyen} bằng ${UngVien.Nguoi.HoTen}`,
          GiaiThich: LaNguoiPhuTrach
            ? "Ứng viên cùng chức danh với người phụ trách ca, trình độ phù hợp và đã được kiểm tra lịch. Việc đổi người phụ trách vẫn cần người quản lý quyết định."
            : "Ứng viên cùng chức danh, trình độ phù hợp và đã được kiểm tra lịch.",
          ThayDoi: ThayDoi,
          DanhGia: DanhGia,
          DanhSachDanhDoi: [
            LaNguoiPhuTrach
              ? "Thay đổi người phụ trách của ca quay."
              : "Cần bàn giao nhiệm vụ cho nhân sự thay thế.",
          ],
          TieuChiXepHang: [
            "Giữ nguyên lịch",
            `Trình độ so với người gốc ${UngVien.DiemTrinhDo}%`,
            "Nguồn lực nội bộ",
          ],
          DiemNen:
            (LaNguoiPhuTrach ? 125 : 140) +
            (CaQuay.CacYeuCauTaiNguyen.some(
              (Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.NHAN_SU,
            )
              ? UngVien.DiemTrinhDo / 10
              : 0),
        }),
      );
    }
    const DauTien = DanhSach[0];
    if (DauTien) {
      if (LaNguoiPhuTrach)
        ThayDoiHangDau.NguoiPhuTrach = {
          TuId: Muc.TaiNguyenId,
          TenNguoiGoc: Muc.TenTaiNguyen,
          DenId: DauTien.Nguoi.Id,
          TenNguoiMoi: DauTien.Nguoi.HoTen,
        };
      else
        (ThayDoiHangDau.NhanSu ??= []).push({
          TuId: Muc.TaiNguyenId,
          TenNhanSuGoc: Muc.TenTaiNguyen,
          DenId: DauTien.Nguoi.Id,
          TenNhanSuMoi: DauTien.Nguoi.HoTen,
          ChucDanhPhanCong: ChucDanhPhanCong ?? "Thành viên ê-kíp",
        });
    }
  }
  return { PhuongAn: PhuongAn, ThayDoiHangDau: ThayDoiHangDau };
}

async function TaoPhuongAnThueNgoai(
  CaQuay: CaQuayPhanTich,
  XungDot: ChiTietXungDot[],
  ThietBiDaCoThayThe: Set<string>,
  Db: Prisma.TransactionClient,
) {
  const CacId = [
    ...new Set(
      XungDot.filter((Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.THIET_BI).map(
        (Muc) => Muc.TaiNguyenId,
      ),
    ),
  ].filter((Id) => !ThietBiDaCoThayThe.has(Id));
  return CacId.flatMap((Id) => {
    const Goc = CaQuay.DanhSachThietBi.find(
      (Muc) => Muc.ThietBiId === Id,
    )?.ThietBi;
    if (!Goc) return [];
    const YeuCau = CaQuay.CacYeuCauTaiNguyen.filter(
      (Muc) =>
        Muc.LoaiTaiNguyen === "THIET_BI" &&
        (!Muc.DanhMucThietBiId || Muc.DanhMucThietBiId === Goc.DanhMucId),
    );
    return [
      TaoPhuongAn({
        LoaiChienLuoc: "THUE_THIET_BI_BEN_NGOAI",
        Nhom: "THUE_NGOAI",
        TieuDe: "Cân nhắc thuê ngoài để thay " + Goc.TenThietBi,
        GiaiThich:
          "Chưa có thiết bị nội bộ phù hợp. Liên hệ bên cho thuê để xác nhận thông số, số lượng, giá và thời gian giao nhận.",
        ThayDoi: {
          ThietBi: [
            {
              TuId: Id,
              TenThietBiGoc: Goc.TenThietBi,
              TenThietBiMoi: Goc.TenThietBi,
              Nguon: "THUE_NGOAI",
              TinhTrangXacNhan: "CAN_LIEN_HE",
            },
          ],
        },
        DanhGia: { XungDotDaGiaiQuyet: [], XungDotConLai: XungDot },
        KhaThi: "TU_VAN",
        ApDungDuoc: false,
        DanhSachDanhDoi: [
          "Cần xác nhận nguồn thuê và khả năng phối hợp với thiết bị còn lại.",
          ...YeuCau.map(
            (Muc) =>
              "Cần " +
              Muc.SoLuong +
              " thiết bị đáp ứng yêu cầu " +
              (Muc.BatBuoc ? "bắt buộc" : "ưu tiên") +
              ".",
          ),
        ],
        ChiPhi: null,
        NhanChiPhi: "Cần báo giá",
        DoDayDuDuLieu: "HAN_CHE",
        TieuChiXepHang: [
          "Không có thay thế nội bộ phù hợp",
          "Chỉ là đề xuất liên hệ thuê ngoài",
        ],
        DiemNen: 80,
      }),
    ];
  });
}

function TaoPhuongAnTuVan(
  CaQuay: CaQuayPhanTich,
  XungDot: ChiTietXungDot[],
  CoThueNgoai: boolean,
) {
  const DanhGia = { XungDotDaGiaiQuyet: [], XungDotConLai: XungDot };
  const KetQua = [
    TaoPhuongAn({
      LoaiChienLuoc: "DIEU_CHINH_YEU_CAU_KY_THUAT",
      Nhom: "CAN_XU_LY_THU_CONG",
      TieuDe: "Điều chỉnh yêu cầu kỹ thuật",
      GiaiThich:
        "Xem xét nới yêu cầu tối thiểu hoặc thay đổi cấu hình ghi hình. Hệ thống không tự thay đổi yêu cầu sản xuất.",
      ThayDoi: {},
      DanhGia: DanhGia,
      KhaThi: "TU_VAN",
      ApDungDuoc: false,
      DanhSachDanhDoi: [
        "Có thể ảnh hưởng chất lượng hình ảnh, âm thanh hoặc quy trình hậu kỳ.",
      ],
      DoDayDuDuLieu: "HAN_CHE",
      TieuChiXepHang: [
        "Chỉ dùng khi không giữ được yêu cầu hiện tại",
        "Cần quyết định chuyên môn",
      ],
      DiemNen: 35,
    }),
    TaoPhuongAn({
      LoaiChienLuoc: "CHIA_LAI_CA_QUAY",
      Nhom: "CAN_XU_LY_THU_CONG",
      TieuDe: "Chia lại nội dung ca quay",
      GiaiThich:
        "Tách phần cần nhiều thiết bị hoặc cảnh quay bổ sung sang một khung giờ khác. MEDIOPS hiện chưa có mô hình cảnh/sub-shift nên không tự tạo bản ghi.",
      ThayDoi: {},
      DanhGia: DanhGia,
      KhaThi: "TU_VAN",
      ApDungDuoc: false,
      DanhSachDanhDoi: [
        "Cần lập lại call sheet và bàn giao liên tục giữa các phần quay.",
      ],
      DoDayDuDuLieu: "HAN_CHE",
      TieuChiXepHang: ["Giảm áp lực tài nguyên", "Cần lập kế hoạch thủ công"],
      DiemNen: 25,
    }),
  ];
  if (!CoThueNgoai)
    KetQua.push(
      TaoPhuongAn({
        LoaiChienLuoc: "CAN_NHAC_MUA_BO_SUNG",
        Nhom: "CAN_XU_LY_THU_CONG",
        TieuDe: "Cân nhắc mua bổ sung",
        GiaiThich:
          "Đây là phương án chiến lược cuối cùng, chỉ phù hợp nếu thiếu hụt lặp lại. Hệ thống không thực hiện quy trình mua sắm.",
        ThayDoi: {},
        DanhGia: DanhGia,
        KhaThi: "TU_VAN",
        ApDungDuoc: false,
        DanhSachDanhDoi: [
          "Cần phân tích tần suất thiếu hụt, ngân sách và chi phí sở hữu.",
        ],
        DoDayDuDuLieu: "HAN_CHE",
        TieuChiXepHang: [
          "Xếp sau thuê ngoài",
          "Chỉ phù hợp cho nhu cầu lặp lại",
        ],
        DiemNen: 10,
      }),
    );
  return KetQua;
}

function TaoPhuongAnRaSoatUuTien(
  CaQuay: CaQuayPhanTich,
  XungDot: ChiTietXungDot[],
) {
  const CacCaCanRaSoat = [
    ...new Map(
      XungDot.flatMap((Muc) => (Muc.CaQuayBiTrung ? [Muc.CaQuayBiTrung] : []))
        .filter(
          (Muc) =>
            Muc.TrangThai === TrangThaiCaQuay.DU_THAO ||
            Muc.MucDoUuTien < CaQuay.MucDoUuTien,
        )
        .map((Muc) => [Muc.Id, Muc]),
    ).values(),
  ];
  if (!CacCaCanRaSoat.length) return undefined;
  const CoCaDuThao = CacCaCanRaSoat.some(
    (Muc) => Muc.TrangThai === TrangThaiCaQuay.DU_THAO,
  );
  return TaoPhuongAn({
    LoaiChienLuoc: "RA_SOAT_UU_TIEN",
    Nhom: "CAN_XU_LY_THU_CONG",
    TieuDe: CoCaDuThao
      ? "Rà soát ca giữ chỗ dự thảo"
      : "Rà soát ưu tiên giữa các ca quay",
    GiaiThich:
      "Một hoặc nhiều ca đang chặn là bản dự thảo hoặc có mức ưu tiên thấp hơn. Người quản lý có thể liên hệ chủ ca để quyết định; hệ thống không tự hủy, dời hay lấy tài nguyên của ca khác.",
    ThayDoi: {},
    DanhGia: { XungDotDaGiaiQuyet: [], XungDotConLai: XungDot },
    KhaThi: "TU_VAN",
    ApDungDuoc: false,
    DanhSachDanhDoi: [
      `Cần rà soát thủ công ${CacCaCanRaSoat.length} ca quay liên quan trước khi thay đổi cam kết.`,
    ],
    DoDayDuDuLieu: "DAY_DU",
    TieuChiXepHang: [
      "Trạng thái cam kết của ca đang chặn",
      `Mức ưu tiên ca hiện tại ${CaQuay.MucDoUuTien}/100`,
      "Không tự động ghi đè lịch của ca khác",
    ],
    DiemNen: CoCaDuThao ? 70 : 55,
  });
}

export async function GoiYGiaiQuyetXungDot(
  CaQuayId: string,
  DonViId: string,
  Db: Prisma.TransactionClient = CoSoDuLieu,
  VanHanh?: { HieuLuc: Date },
): Promise<KetQuaGiaiQuyetXungDot> {
  const CaQuay = await LayCaQuayPhanTich(CaQuayId, DonViId, Db);
  if (VanHanh) {
    CaQuay.ThoiGianBatDau = VanHanh.HieuLuc;
    CaQuay.ThoiGianChuanBiPhut = 0;
    CaQuay.CoTheDoiLich = false;
  }
  const KetQuaXungDot = await KiemTraXungDotToanDien(
    TaoThamSoKiemTra(CaQuay),
    Db,
  );
  const XungDot = KetQuaXungDot.DanhSachXungDot;
  const MaPhienBan = TaoMaBam({
    CaQuay: {
      ThoiGianBatDau: CaQuay.ThoiGianBatDau,
      ThoiGianKetThuc: CaQuay.ThoiGianKetThuc,
      TrangThai: CaQuay.TrangThai,
      MucDoUuTien: CaQuay.MucDoUuTien,
      CoTheDoiLich: CaQuay.CoTheDoiLich,
      ThoiGianBatDauSomNhat: CaQuay.ThoiGianBatDauSomNhat,
      ThoiGianKetThucMuonNhat: CaQuay.ThoiGianKetThucMuonNhat,
      ThoiGianChuanBiPhut: CaQuay.ThoiGianChuanBiPhut,
      ThoiGianThuHoiPhut: CaQuay.ThoiGianThuHoiPhut,
      PhongStudioId: CaQuay.PhongStudioId,
      NguoiPhuTrachId: CaQuay.NguoiPhuTrachId,
      YeuCau: [...CaQuay.CacYeuCauTaiNguyen]
        .sort((A, B) => A.Id.localeCompare(B.Id))
        .map((Muc) => ({
          Id: Muc.Id,
          MaYeuCau: Muc.MaYeuCau,
          LoaiTaiNguyen: Muc.LoaiTaiNguyen,
          SoLuong: Muc.SoLuong,
          BatBuoc: Muc.BatBuoc,
          ChoPhepThayThe: Muc.ChoPhepThayThe,
          TrongSo: Muc.TrongSo,
          DanhMucThietBiId: Muc.DanhMucThietBiId,
          ThietBiUuTienId: Muc.ThietBiUuTienId,
          ChucDanhId: Muc.ChucDanhId,
          ThongSoToiThieu: Muc.ThongSoToiThieu,
          ThongSoUuTien: Muc.ThongSoUuTien,
        })),
      DanhSachThietBi: CaQuay.DanhSachThietBi.map(
        (Muc) => Muc.ThietBiId,
      ).sort(),
      DanhSachNhanSu: CaQuay.DanhSachNhanSu.map((Muc) => [
        Muc.NguoiDungId,
        Muc.ChucDanhPhanCong,
      ]).sort(),
    },
    XungDot: XungDot.map((Muc) => ({
      Khoa: TaoKhoaXungDot(Muc),
      ThoiGianBatDau: Muc.CaQuayBiTrung?.ThoiGianBatDau,
      ThoiGianKetThuc: Muc.CaQuayBiTrung?.ThoiGianKetThuc,
      TrangThai: Muc.CaQuayBiTrung?.TrangThai,
      MucDoUuTien: Muc.CaQuayBiTrung?.MucDoUuTien,
      BatDauKhongKhaDung: Muc.KhoangKhongKhaDung?.BatDau,
      KetThucKhongKhaDung: Muc.KhoangKhongKhaDung?.KetThuc,
    })).sort((A, B) => A.Khoa.localeCompare(B.Khoa)),
  });
  if (!XungDot.length) {
    const DanhGia = await DanhGiaYeuCauPhuongAn(CaQuay, {}, Db);
    return {
      CaQuayId: CaQuayId,
      MaPhienBan: MaPhienBan,
      DanhSachXungDot: [],
      DanhSachPhuongAn: [],
      ThongBao: DanhGia.DapUngBatBuoc
        ? "Ca quay hiện không có xung đột cần xử lý."
        : `Ca quay không có xung đột lịch nhưng cần rà soát yêu cầu tài nguyên. ${DanhGia.DienGiai.join(" ")}`,
    };
  }

  const [ThoiGian, ThietBi, Studio, Nguoi] = await Promise.all([
    TaoPhuongAnDoiThoiGian(CaQuay, XungDot, Db),
    TaoPhuongAnThayThietBi(CaQuay, XungDot, Db, Boolean(VanHanh)),
    TaoPhuongAnDoiStudio(CaQuay, XungDot, Db),
    TaoPhuongAnDoiNguoi(CaQuay, XungDot, Db),
  ]);
  const DanhSach = [
    ...ThietBi.PhuongAn,
    ...Studio.PhuongAn,
    ...Nguoi.PhuongAn,
    ...ThoiGian,
  ];
  const RaSoatUuTien = TaoPhuongAnRaSoatUuTien(CaQuay, XungDot);
  if (RaSoatUuTien) DanhSach.push(RaSoatUuTien);
  const ThayDoiPhoiHop: ThayDoiGiaiQuyet = {
    ...(ThietBi.LuaChonHangDau.length
      ? { ThietBi: ThietBi.LuaChonHangDau }
      : {}),
    ...(Studio.LuaChon
      ? {
          Studio: {
            TuId: CaQuay.PhongStudioId,
            DenId: Studio.LuaChon.Id,
            TenStudio: Studio.LuaChon.TenPhong,
          },
        }
      : {}),
    ...Nguoi.ThayDoiHangDau,
  };
  if (Object.keys(ThayDoiPhoiHop).length >= 2) {
    const DanhGia = await DanhGiaThayDoi(CaQuay, XungDot, ThayDoiPhoiHop, Db);
    DanhSach.push(
      TaoPhuongAn({
        LoaiChienLuoc: "PHOI_HOP_THAY_DOI",
        Nhom: "GIU_NGUYEN_LICH",
        TieuDe: "Phối hợp nhiều thay đổi để giữ nguyên lịch",
        GiaiThich:
          "Kết hợp các lựa chọn nội bộ có thứ hạng cao nhất và kiểm tra lại toàn bộ phương án như một khối thống nhất.",
        ThayDoi: ThayDoiPhoiHop,
        DanhGia: DanhGia,
        DanhSachDanhDoi: [
          "Nhiều đầu mối cần được xác nhận và bàn giao đồng thời.",
        ],
        TieuChiXepHang: [
          "Giải quyết nhiều xung đột cùng lúc",
          "Giữ nguyên lịch",
          "Chỉ dùng nguồn lực nội bộ",
        ],
        DiemNen: 170,
      }),
    );
  }

  const ThietBiDaCoThayThe = new Set(
    ThietBi.PhuongAn.filter(
      (Muc) =>
        Muc.XungDotConLai.length === 0 &&
        Muc.DanhGiaYeuCau?.DapUngBatBuoc !== false,
    ).flatMap(
      (Muc) => Muc.ThayDoi.ThietBi?.map((ThayDoi) => ThayDoi.TuId) ?? [],
    ),
  );
  const ThueNgoai = await TaoPhuongAnThueNgoai(
    CaQuay,
    XungDot,
    ThietBiDaCoThayThe,
    Db,
  );
  DanhSach.push(...ThueNgoai);
  if (
    !DanhSach.some(
      (Muc) =>
        Muc.XungDotConLai.length === 0 &&
        Muc.KhaThi !== "TU_VAN" &&
        Muc.DanhGiaYeuCau?.DapUngBatBuoc !== false,
    )
  ) {
    DanhSach.push(...TaoPhuongAnTuVan(CaQuay, XungDot, ThueNgoai.length > 0));
    DanhSach.push(
      TaoPhuongAn({
        LoaiChienLuoc: "XU_LY_THU_CONG",
        Nhom: "CAN_XU_LY_THU_CONG",
        TieuDe: "Cần người quản lý xử lý",
        GiaiThich:
          "Chưa tìm được phương án tự động phù hợp để giải quyết toàn bộ xung đột. Giữ nguyên dữ liệu hiện tại và rà soát thủ công.",
        ThayDoi: {},
        DanhGia: { XungDotDaGiaiQuyet: [], XungDotConLai: XungDot },
        KhaThi: "TU_VAN",
        ApDungDuoc: false,
        DoDayDuDuLieu: "HAN_CHE",
        TieuChiXepHang: [
          "Trạng thái an toàn",
          "Không ép một phương án chất lượng thấp",
        ],
        DiemNen: 0,
      }),
    );
  }

  for (const Muc of DanhSach) {
    if (!VanHanh && CaQuay.TrangThai === "DANG_DIEN_RA") {
      Muc.ApDungDuoc = false;
      Muc.KhaThi = "TU_VAN";
      Muc.GiaiThich +=
        " Ca đang diễn ra cần báo sự cố vận hành, xác nhận mốc bàn giao; nhân sự cần nhận lời mời rồi người điều phối chốt.";
    }
    Muc.DanhGiaYeuCau ??= await DanhGiaYeuCauPhuongAn(CaQuay, Muc.ThayDoi, Db);
    Muc.TieuChiXepHang.push(...Muc.DanhGiaYeuCau.DienGiai);
    if (!Muc.DanhGiaYeuCau.DapUngBatBuoc) {
      Muc.ApDungDuoc = false;
      Muc.KhaThi =
        Muc.DanhGiaYeuCau.TrangThai === "CHUA_DU_DU_LIEU"
          ? "CAN_XAC_NHAN"
          : "TU_VAN";
      Muc.DoDayDuDuLieu = "MOT_PHAN";
      Muc.GiaiThich += ` ${Muc.DanhGiaYeuCau.DienGiai.join(" ")}`;
    }
  }
  const DuyNhat = [
    ...new Map(
      DanhSach.filter(
        (Muc) =>
          !VanHanh ||
          (!Muc.ThayDoi.ThoiGian &&
            (!!Muc.ThayDoi.ThietBi?.length ||
              !!Muc.ThayDoi.NhanSu?.length ||
              !!Muc.ThayDoi.Studio ||
              !!Muc.ThayDoi.NguoiPhuTrach)),
      ).map((Muc) => [Muc.Id, Muc]),
    ).values(),
  ];
  const DaSapXep = DuyNhat.sort(
    (A, B) =>
      Number(B.DanhGiaYeuCau?.DapUngBatBuoc ?? true) -
        Number(A.DanhGiaYeuCau?.DapUngBatBuoc ?? true) ||
      Number(B.XungDotConLai.length === 0) -
        Number(A.XungDotConLai.length === 0) ||
      (B.DanhGiaYeuCau?.DiemUuTien ?? 0) - (A.DanhGiaYeuCau?.DiemUuTien ?? 0) ||
      B.DiemXepHang - A.DiemXepHang ||
      A.TieuDe.localeCompare(B.TieuDe, "vi") ||
      A.Id.localeCompare(B.Id),
  ).map(({ DiemXepHang: DiemXepHang, ...Muc }, ChiSo) => ({
    ...Muc,
    ThuTuUuTien: ChiSo + 1,
  }));
  return {
    CaQuayId: CaQuayId,
    MaPhienBan: MaPhienBan,
    DanhSachXungDot: XungDot,
    DanhSachPhuongAn: DaSapXep.slice(0, 3),
    ThongBao:
      "Các phương án được xếp theo tiêu chí hiện tại để hỗ trợ quyết định; hệ thống không tự chọn thay người quản lý.",
  };
}

export async function ApDungPhuongAnGiaiQuyet(ThamSo: {
  CaQuayId: string;
  DonViId: string;
  PhuongAnId: string;
  MaPhienBan: string;
}) {
  return ThucHienGiaoDichLich(async (Db) => {
    const KetQuaMoi = await GoiYGiaiQuyetXungDot(
      ThamSo.CaQuayId,
      ThamSo.DonViId,
      Db,
    );
    if (KetQuaMoi.MaPhienBan !== ThamSo.MaPhienBan) {
      throw new LoiXungDotDuLieu(
        "Dữ liệu lịch hoặc tài nguyên đã thay đổi. Hãy tải lại các phương án trước khi áp dụng.",
      );
    }
    const PhuongAn = KetQuaMoi.DanhSachPhuongAn.find(
      (Muc) => Muc.Id === ThamSo.PhuongAnId,
    );
    if (!PhuongAn) {
      throw new LoiXungDotDuLieu(
        "Phương án không còn khả dụng. Hãy tải lại các phương án trước khi áp dụng.",
      );
    }
    if (!PhuongAn.ApDungDuoc || PhuongAn.XungDotConLai.length) {
      throw new LoiDuLieuKhongHopLe(
        "Phương án không còn hợp lệ hoặc không thể áp dụng tự động.",
      );
    }
    if (
      (PhuongAn.ThayDoi.NhanSu?.length || PhuongAn.ThayDoi.NguoiPhuTrach) &&
      !LayPhienGiuChoNoiBo()
    )
      throw new LoiDuLieuKhongHopLe(
        "Cần gửi lời mời, nhận đồng ý rồi chốt qua phiên quyết định.",
      );
    const CaQuay = await LayCaQuayPhanTich(ThamSo.CaQuayId, ThamSo.DonViId, Db);
    if (CaQuay.TrangThai === "DANG_DIEN_RA") {
      throw new LoiDuLieuKhongHopLe(
        "Ca đang quay cần xử lý qua sự cố vận hành và mốc bàn giao; nhân sự cần nhận lời mời rồi người điều phối chốt.",
      );
    }
    const ThayTheThietBi = new Map(
      (PhuongAn.ThayDoi.ThietBi ?? [])
        .filter((Muc) => Muc.DenId)
        .map((Muc) => [Muc.TuId, Muc.DenId as string]),
    );
    const ThayTheNhanSu = new Map(
      (PhuongAn.ThayDoi.NhanSu ?? []).map((Muc) => [Muc.TuId, Muc.DenId]),
    );
    await CapNhatCaQuayTrongGiaoDich(
      Db,
      CaQuay.Id,
      {
        ...(PhuongAn.ThayDoi.ThoiGian
          ? {
              ThoiGianBatDau: PhuongAn.ThayDoi.ThoiGian.BatDau,
              ThoiGianKetThuc: PhuongAn.ThayDoi.ThoiGian.KetThuc,
            }
          : {}),
        ...(PhuongAn.ThayDoi.Studio
          ? { PhongStudioId: PhuongAn.ThayDoi.Studio.DenId }
          : {}),
        ...(PhuongAn.ThayDoi.NguoiPhuTrach
          ? { NguoiPhuTrachId: PhuongAn.ThayDoi.NguoiPhuTrach.DenId }
          : {}),
        // Ghi đúng cấu hình đã được đánh giá (DanhGiaThayDoi), kể cả bộ chuyển ngàm bổ sung;
        // nếu bỏ bộ chuyển, ca sẽ còn máy và ống kính khác ngàm.
        ...(ThayTheThietBi.size || PhuongAn.ThayDoi.ThietBiBoSung?.length
          ? {
              DanhSachThietBiId: [
                ...new Set([
                  ...CaQuay.DanhSachThietBi.map(
                    (Muc) => ThayTheThietBi.get(Muc.ThietBiId) ?? Muc.ThietBiId,
                  ),
                  ...(PhuongAn.ThayDoi.ThietBiBoSung ?? []).map(
                    (Muc) => Muc.Id,
                  ),
                ]),
              ],
            }
          : {}),
        ...(ThayTheNhanSu.size
          ? {
              DanhSachNhanSu: CaQuay.DanhSachNhanSu.map((Muc) => ({
                NguoiDungId:
                  ThayTheNhanSu.get(Muc.NguoiDungId) ?? Muc.NguoiDungId,
                ChucDanhPhanCong: Muc.ChucDanhPhanCong,
              })),
            }
          : {}),
      },
      ThamSo.DonViId,
    );
    return { DaApDung: true, PhuongAnId: PhuongAn.Id };
  });
}

// Kiểm tra phương án đã chọn trực tiếp, không phụ thuộc thứ hạng hiện tại.
export async function KiemTraPhuongAnVanHanh(
  CaId: string,
  DonViId: string,
  HieuLuc: Date,
  ThayDoi: ThayDoiGiaiQuyet,
  Db: Prisma.TransactionClient,
  LaXepLich = false,
) {
  const Ca = await LayCaQuayPhanTich(CaId, DonViId, Db);
  if (
    ["DA_HUY", "HOAN_THANH"].includes(Ca.TrangThai) ||
    HieuLuc < new Date() ||
    HieuLuc >= Ca.ThoiGianKetThuc
  )
    return false;
  if (!LaXepLich) {
    Ca.ThoiGianBatDau = HieuLuc;
    Ca.ThoiGianChuanBiPhut = 0;
  }
  if (ThayDoi.ThoiGian) {
    Ca.ThoiGianBatDau = ThayDoi.ThoiGian.BatDau;
    Ca.ThoiGianKetThuc = ThayDoi.ThoiGian.KetThuc;
  }
  for (const Muc of ThayDoi.ThietBi ?? []) {
    if (Muc.Nguon !== "NOI_BO" || !Muc.DenId) return false;
    const GoiY = await TimThietBiThayThe(
      {
        DonViId,
        CaQuayId: CaId,
        ThietBiGocId: Muc.TuId,
        ThoiGianBatDau: HieuLuc,
        ThoiGianKetThuc: Ca.ThoiGianKetThuc,
        ThoiGianChuanBiPhut: 0,
      },
      Db,
    );
    const UngVien = GoiY.find((May) => May.ThietBi.Id === Muc.DenId);
    if (
      !UngVien ||
      UngVien.TuongThichKyThuat.ThietBiTrungGian.some(
        (May) =>
          !Ca.DanhSachThietBi.some((Cu) => Cu.ThietBiId === May.Id) &&
          !ThayDoi.ThietBiBoSung?.some((Them) => Them.Id === May.Id),
      )
    )
      return false;
  }
  for (const Muc of [
    ...(ThayDoi.NhanSu ?? []),
    ...(ThayDoi.NguoiPhuTrach ? [ThayDoi.NguoiPhuTrach] : []),
  ]) {
    const UngVien = await TimNguoiThayThe(Ca, Muc.TuId, Db);
    if (!UngVien.some((Nguoi) => Nguoi.Nguoi.Id === Muc.DenId)) return false;
  }
  const KetQua = await DanhGiaThayDoi(Ca, [], ThayDoi, Db);
  return !KetQua.XungDotConLai.length && KetQua.DanhGiaYeuCau.DapUngBatBuoc;
}
