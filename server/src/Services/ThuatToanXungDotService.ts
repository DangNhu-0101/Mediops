import { LayPhienGiuChoNoiBo } from "./NguCanhGiuChoService.js";
import { DocTaiNguyenSuCo } from "./HopDongSuCoVanHanh.js";
import { DocKhoangBan } from "./DuLieuNhungService.js";
import {
  LoaiTaiNguyen,
  type Prisma,
  TrangThaiCaQuay,
  TrangThaiMuonTra,
  TrangThaiStudio,
  TrangThaiSuCo,
  TrangThaiThietBi,
} from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay } from "./LoiNghiepVuService.js";
import {
  DemToiDaPhut,
  HaiKhoangGiaoNhau,
  TaoKhoangHieuLuc,
  TaoKhoangPhanCongThietBi,
} from "./ThoiGianHieuLucService.js";

export type LoaiXungDot =
  | "TRUNG_LICH_CA_QUAY"
  | "KHONG_KHA_DUNG"
  | "TRANG_THAI_KHONG_CHO_PHEP"
  | "CHUA_HOAN_TRA"
  | "SU_CO_CHUA_XU_LY";

export interface ChiTietXungDot {
  LoaiTaiNguyen: LoaiTaiNguyen;
  TaiNguyenId: string;
  TenTaiNguyen: string;
  LoaiXungDot: LoaiXungDot;
  ViTriNguoi?: "NGUOI_PHU_TRACH" | "NHAN_SU";
  TrangThaiTaiNguyen?: string;
  CaQuayBiTrung?: {
    Id: string;
    MaCaQuay: string | null;
    TieuDe: string;
    ThoiGianBatDau: Date;
    ThoiGianKetThuc: Date;
    ThoiGianChuanBiPhut: number;
    ThoiGianThuHoiPhut: number;
    TrangThai: TrangThaiCaQuay;
    MucDoUuTien: number;
  };
  KhoangKhongKhaDung?: {
    Id: string;
    BatDau: Date;
    KetThuc: Date;
    LyDo: string | null;
  };
  MuonTraQuaHan?: {
    CaQuayId: string;
    TieuDeCaQuay: string;
    ThoiGianKetThuc: Date;
  };
}

export interface KetQuaXungDot {
  CoXungDot: boolean;
  DanhSachXungDot: ChiTietXungDot[];
}

export interface ThamSoKiemTraXungDot {
  DonViId: string;
  ThoiGianBatDau: Date;
  ThoiGianKetThuc: Date;
  PhongStudioId?: string | null;
  NguoiPhuTrachId?: string;
  DanhSachThietBiId?: string[];
  DanhSachNhanSuId?: string[];
  CaQuayHienTaiId?: string;
  ThoiGianChuanBiPhut?: number;
  ThoiGianThuHoiPhut?: number;
}

export async function KiemTraXungDotToanDien(
  ThamSo: ThamSoKiemTraXungDot,
  Db: Prisma.TransactionClient = CoSoDuLieu,
): Promise<KetQuaXungDot> {
  const {
    ThoiGianBatDau: ThoiGianBatDau,
    ThoiGianKetThuc: ThoiGianKetThuc,
    PhongStudioId: PhongStudioId,
    NguoiPhuTrachId: NguoiPhuTrachId,
    CaQuayHienTaiId: CaQuayHienTaiId,
  } = ThamSo;
  const DanhSachThietBiId = [...new Set(ThamSo.DanhSachThietBiId ?? [])];
  const DanhSachNhanSuId = [...new Set(ThamSo.DanhSachNhanSuId ?? [])];
  const DanhSachNguoiCanKiemTraId = [
    ...new Set([
      ...(NguoiPhuTrachId ? [NguoiPhuTrachId] : []),
      ...DanhSachNhanSuId,
    ]),
  ];

  if (
    Number.isNaN(ThoiGianBatDau.getTime()) ||
    Number.isNaN(ThoiGianKetThuc.getTime()) ||
    ThoiGianBatDau >= ThoiGianKetThuc
  ) {
    throw new Error("Khoảng thời gian ca quay không hợp lệ");
  }

  await BaoDamTaiNguyenKiemTraThuocDonVi(
    {
      PhongStudioId: PhongStudioId,
      NguoiPhuTrachId: NguoiPhuTrachId,
      DanhSachThietBiId: DanhSachThietBiId,
      DanhSachNhanSuId: DanhSachNhanSuId,
      CaQuayHienTaiId: CaQuayHienTaiId,
    },
    ThamSo.DonViId,
    Db,
  );

  const DieuKienCaDangChan = {
    DuAn: { DonViId: ThamSo.DonViId },
    ...(CaQuayHienTaiId ? { Id: { not: CaQuayHienTaiId } } : {}),
    TrangThai: { notIn: [TrangThaiCaQuay.DA_HUY, TrangThaiCaQuay.HOAN_THANH] },
  };
  const KhoangHieuLucChung = TaoKhoangHieuLuc({
    ThoiGianBatDau: ThoiGianBatDau,
    ThoiGianKetThuc: ThoiGianKetThuc,
    ThoiGianChuanBiPhut: ThamSo.ThoiGianChuanBiPhut,
    ThoiGianThuHoiPhut: ThamSo.ThoiGianThuHoiPhut,
  });
  // Lọc thô theo giờ ở SQL. Ca c chỉ có thể giao ca mới khi
  //   S_c − P_c < E_n + R_n + Q  và  E_c + R_c + Q > S_n − P_n,
  // với P_c, R_c, Q ≤ DemToiDaPhut. Nới mỗi đầu 2·DemToiDaPhut là tập cha an toàn;
  // phép giao chính xác vẫn làm trong bộ nhớ ở dưới.
  const BienLocThoMs = 2 * DemToiDaPhut * 60_000;
  const DieuKienCaTrongCuaSo = {
    ...DieuKienCaDangChan,
    ThoiGianBatDau: {
      lt: new Date(KhoangHieuLucChung.KetThuc.getTime() + BienLocThoMs),
    },
    ThoiGianKetThuc: {
      gt: new Date(KhoangHieuLucChung.BatDau.getTime() - BienLocThoMs),
    },
  };
  const BayGio = new Date();

  const [
    CacCaTrungStudio,
    CacCaTrungThietBi,
    CacCaTrungNhanSu,
    CacKhoangStudioKhongKhaDung,
    CacKhoangThietBiKhongKhaDung,
    CacKhoangNhanSuKhongKhaDung,
    StudioDuocChon,
    CacThietBiDuocChon,
    CacLanDangDungCuaCaHienTai,
    CacLanDangMuonCuaCaKhac,
    CacSuCoChuaXuLy,
  ] = await Promise.all([
    PhongStudioId
      ? Db.caQuay.findMany({
          where: {
            ...DieuKienCaTrongCuaSo,
            OR: [
              { PhongStudioId },
              { LichSuStudio: { array_contains: [{ Id: PhongStudioId }] } },
            ],
          },
          select: {
            Id: true,
            MaCaQuay: true,
            TieuDe: true,
            ThoiGianBatDau: true,
            ThoiGianKetThuc: true,
            ThoiGianChuanBiPhut: true,
            ThoiGianThuHoiPhut: true,
            TrangThai: true,
            MucDoUuTien: true,
            PhongStudioId: true,
            StudioHieuLucTu: true,
            LichSuStudio: true,
            PhongStudio: { select: { TenPhong: true } },
          },
          orderBy: [{ ThoiGianBatDau: "asc" }, { Id: "asc" }],
        })
      : [],
    DanhSachThietBiId.length
      ? Db.caQuayThietBi.findMany({
          where: {
            ThietBiId: { in: DanhSachThietBiId },
            // So với đầu khoảng có đệm chuẩn bị của ca mới, không phải giờ quay gốc:
            // phân công cắt lúc 10:00 vẫn chặn ca 10:30 có chuẩn bị 60 phút.
            OR: [
              { HieuLucDen: null },
              { HieuLucDen: { gt: KhoangHieuLucChung.BatDau } },
            ],
            CaQuay: DieuKienCaTrongCuaSo,
          },
          select: {
            ThietBiId: true,
            HieuLucTu: true,
            HieuLucDen: true,
            ThietBi: { select: { TenThietBi: true } },
            CaQuay: {
              select: {
                Id: true,
                MaCaQuay: true,
                TieuDe: true,
                ThoiGianBatDau: true,
                ThoiGianKetThuc: true,
                ThoiGianChuanBiPhut: true,
                ThoiGianThuHoiPhut: true,
                TrangThai: true,
                MucDoUuTien: true,
              },
            },
          },
          orderBy: [{ CaQuay: { ThoiGianBatDau: "asc" } }, { Id: "asc" }],
        })
      : [],
    DanhSachNguoiCanKiemTraId.length
      ? Db.caQuay.findMany({
          where: {
            ...DieuKienCaTrongCuaSo,
            OR: [
              { NguoiPhuTrachId: { in: DanhSachNguoiCanKiemTraId } },
              {
                DanhSachNhanSu: {
                  some: { NguoiDungId: { in: DanhSachNguoiCanKiemTraId } },
                },
              },
            ],
          },
          select: {
            Id: true,
            MaCaQuay: true,
            TieuDe: true,
            ThoiGianBatDau: true,
            ThoiGianKetThuc: true,
            ThoiGianChuanBiPhut: true,
            ThoiGianThuHoiPhut: true,
            TrangThai: true,
            MucDoUuTien: true,
            NguoiPhuTrachId: true,
            NguoiPhuTrachHieuLucTu: true,
            NguoiPhuTrach: { select: { HoTen: true } },
            DanhSachNhanSu: {
              where: { NguoiDungId: { in: DanhSachNguoiCanKiemTraId } },
              select: {
                NguoiDungId: true,
                HieuLucTu: true,
                HieuLucDen: true,
                NguoiDung: { select: { HoTen: true } },
              },
            },
          },
          orderBy: [{ ThoiGianBatDau: "asc" }, { Id: "asc" }],
        })
      : [],
    PhongStudioId
      ? Db.phongStudio
          .findMany({
            where: { Id: PhongStudioId, DonViId: ThamSo.DonViId },
            select: { Id: true, TenPhong: true, CacKhoangKhongKhaDung: true },
          })
          .then((DanhSach) =>
            DanhSach.flatMap((TaiNguyen) =>
              DocKhoangBan(TaiNguyen.CacKhoangKhongKhaDung).map((Khoang) => ({
                ...Khoang,
                BatDau: new Date(Khoang.BatDau),
                KetThuc: new Date(Khoang.KetThuc),
                PhongStudioId: TaiNguyen.Id,
                PhongStudio: { TenPhong: TaiNguyen.TenPhong },
              })),
            ),
          )
      : [],
    DanhSachThietBiId.length
      ? Db.thietBi
          .findMany({
            where: {
              Id: { in: DanhSachThietBiId },
              DanhMuc: { DonViId: ThamSo.DonViId },
            },
            select: { Id: true, TenThietBi: true, CacKhoangKhongKhaDung: true },
          })
          .then((DanhSach) =>
            DanhSach.flatMap((TaiNguyen) =>
              DocKhoangBan(TaiNguyen.CacKhoangKhongKhaDung).map((Khoang) => ({
                ...Khoang,
                BatDau: new Date(Khoang.BatDau),
                KetThuc: new Date(Khoang.KetThuc),
                ThietBiId: TaiNguyen.Id,
                ThietBi: { TenThietBi: TaiNguyen.TenThietBi },
              })),
            ),
          )
      : [],
    DanhSachNguoiCanKiemTraId.length
      ? Db.nguoiDung
          .findMany({
            where: {
              Id: { in: DanhSachNguoiCanKiemTraId },
              DonViId: ThamSo.DonViId,
            },
            select: { Id: true, HoTen: true, CacKhoangKhongKhaDung: true },
          })
          .then((DanhSach) =>
            DanhSach.flatMap((TaiNguyen) =>
              DocKhoangBan(TaiNguyen.CacKhoangKhongKhaDung).map((Khoang) => ({
                ...Khoang,
                BatDau: new Date(Khoang.BatDau),
                KetThuc: new Date(Khoang.KetThuc),
                NguoiDungId: TaiNguyen.Id,
                NguoiDung: { HoTen: TaiNguyen.HoTen },
              })),
            ),
          )
      : [],
    PhongStudioId
      ? Db.phongStudio.findFirst({
          where: { Id: PhongStudioId, DonViId: ThamSo.DonViId },
          select: { Id: true, TenPhong: true, TrangThai: true },
        })
      : null,
    DanhSachThietBiId.length
      ? Db.thietBi.findMany({
          where: {
            Id: { in: DanhSachThietBiId },
            DanhMuc: { DonViId: ThamSo.DonViId },
          },
          select: {
            Id: true,
            TenThietBi: true,
            TrangThai: true,
            ThoiGianKiemTraSauSuDungPhut: true,
            KhoId: true,
            Kho: { select: { DangHoatDong: true } },
            LichSuCaQuay: {
              where: { TrangThaiMuonTra: TrangThaiMuonTra.THAT_LAC },
              select: { Id: true },
              take: 1,
            },
          },
        })
      : [],
    CaQuayHienTaiId && DanhSachThietBiId.length
      ? Db.caQuayThietBi.findMany({
          where: {
            CaQuayId: CaQuayHienTaiId,
            ThietBiId: { in: DanhSachThietBiId },
            TrangThaiMuonTra: TrangThaiMuonTra.DA_XUAT_KHO,
            CaQuay: { DuAn: { DonViId: ThamSo.DonViId } },
          },
          select: { ThietBiId: true },
        })
      : [],
    DanhSachThietBiId.length
      ? Db.caQuayThietBi.findMany({
          where: {
            ThietBiId: { in: DanhSachThietBiId },
            TrangThaiMuonTra: TrangThaiMuonTra.DA_XUAT_KHO,
            ...(CaQuayHienTaiId ? { CaQuayId: { not: CaQuayHienTaiId } } : {}),
            CaQuay: { DuAn: { DonViId: ThamSo.DonViId } },
          },
          select: {
            ThietBiId: true,
            ThietBi: { select: { TenThietBi: true } },
            CaQuay: {
              select: {
                Id: true,
                TieuDe: true,
                ThoiGianKetThuc: true,
                ThoiGianThuHoiPhut: true,
                TrangThai: true,
              },
            },
          },
        })
      : [],
    DanhSachThietBiId.length
      ? Db.suCoBaoTri.findMany({
          where: {
            ThietBiId: { in: DanhSachThietBiId },
            ThietBi: { DanhMuc: { DonViId: ThamSo.DonViId } },
            TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC },
          },
          select: {
            Id: true,
            ThietBiId: true,
            ThietBi: { select: { TenThietBi: true } },
          },
        })
      : [],
  ]);

  const KiemTraGiaoNhauVoiCa = (
    CaQuay: {
      ThoiGianBatDau: Date;
      ThoiGianKetThuc: Date;
      ThoiGianChuanBiPhut: number;
      ThoiGianThuHoiPhut: number;
    },
    KiemTraSauSuDungPhut = 0,
  ) =>
    HaiKhoangGiaoNhau(
      TaoKhoangHieuLuc({
        ...CaQuay,
        ThoiGianKiemTraSauSuDungPhut: KiemTraSauSuDungPhut,
      }),
      TaoKhoangHieuLuc({
        ThoiGianBatDau: ThoiGianBatDau,
        ThoiGianKetThuc: ThoiGianKetThuc,
        ThoiGianChuanBiPhut: ThamSo.ThoiGianChuanBiPhut,
        ThoiGianThuHoiPhut: ThamSo.ThoiGianThuHoiPhut,
        ThoiGianKiemTraSauSuDungPhut: KiemTraSauSuDungPhut,
      }),
    );
  const KiemTraKhoangKhongKhaDung = (Khoang: { BatDau: Date; KetThuc: Date }) =>
    HaiKhoangGiaoNhau(KhoangHieuLucChung, Khoang);
  const KiemTraTheoThietBi = new Map(
    CacThietBiDuocChon.map((ThietBi) => [
      ThietBi.Id,
      ThietBi.ThoiGianKiemTraSauSuDungPhut,
    ]),
  );
  // Khoản mượn của ca khác chỉ là "chưa hoàn trả" khi đã quá hạn trả so với HIỆN TẠI
  // (kết thúc + thu hồi < bây giờ) hoặc ca mượn đã đóng mà máy chưa về kho.
  // Khoản mượn còn trong hạn của ca đang hiệu lực do TRUNG_LICH_CA_QUAY xét theo thời gian.
  const CacLanChuaHoanTra = CacLanDangMuonCuaCaKhac.filter(
    (Muc) =>
      Muc.CaQuay.TrangThai === TrangThaiCaQuay.DA_HUY ||
      Muc.CaQuay.TrangThai === TrangThaiCaQuay.HOAN_THANH ||
      Muc.CaQuay.ThoiGianKetThuc.getTime() +
        Math.max(0, Muc.CaQuay.ThoiGianThuHoiPhut) * 60_000 <
        BayGio.getTime(),
  );
  const IdDangCoKhoanMuon = new Set(
    CacLanDangMuonCuaCaKhac.map((Muc) => Muc.ThietBiId),
  );
  const IdDangDungCuaCaHienTai = new Set(
    CacLanDangDungCuaCaHienTai.map((Muc) => Muc.ThietBiId),
  );

  const CacId = [
    ...DanhSachThietBiId,
    ...DanhSachNguoiCanKiemTraId,
    ...(PhongStudioId ? [PhongStudioId] : []),
  ];
  const SuCoVanHanh = CacId.length
    ? await Db.suCoVanHanh.findMany({
        where: {
          DonViId: ThamSo.DonViId,
          // Mọi sự cố ảnh hưởng ca đều chặn ngay khi được báo để người điều phối xử lý.
          TrangThai: { in: ["MOI_BAO", "DA_XAC_MINH", "DANG_XU_LY"] },
          MucAnhHuong: { not: "VAN_QUAY_DUOC" },
          ThoiDiemXayRa: { lt: KhoangHieuLucChung.KetThuc },
          AND: [
            {
              OR: [
                { KetThucAnhHuong: null },
                { KetThucAnhHuong: { gt: KhoangHieuLucChung.BatDau } },
              ],
            },
            {
              OR: CacId.map((Id) => ({
                TaiNguyen: { array_contains: [{ Id }] },
              })),
            },
          ],
        },
        select: { TaiNguyen: true },
      })
    : [];
  const GiuCho = await Db.giuChoTaiNguyen.findMany({
    where: {
      DonViId: ThamSo.DonViId,
      TrangThai: "MO",
      HetHanLuc: { gt: new Date() },
      ...(LayPhienGiuChoNoiBo()
        ? { PhienId: { not: LayPhienGiuChoNoiBo() } }
        : {}),
      Phien: {
        TrangThai: "MO",
        Ca: { TrangThai: { notIn: ["DA_HUY", "HOAN_THANH"] } },
      },
      OR: [
        { Loai: "THIET_BI", TaiNguyenId: { in: DanhSachThietBiId } },
        ...(PhongStudioId
          ? [{ Loai: "STUDIO" as const, TaiNguyenId: PhongStudioId }]
          : []),
      ],
    },
  });
  const DanhSachXungDot: ChiTietXungDot[] = [
    ...GiuCho.filter((Muc) =>
      HaiKhoangGiaoNhau(
        Muc,
        TaoKhoangHieuLuc({
          ...ThamSo,
          ThoiGianKiemTraSauSuDungPhut:
            KiemTraTheoThietBi.get(Muc.TaiNguyenId) ?? 0,
        }),
      ),
    ).map((Muc) => ({
      LoaiTaiNguyen: Muc.Loai,
      TaiNguyenId: Muc.TaiNguyenId,
      TenTaiNguyen: "Tài nguyên đang được giữ chỗ có thời hạn",
      LoaiXungDot: "KHONG_KHA_DUNG" as const,
    })),
    ...SuCoVanHanh.flatMap((SuCo) =>
      DocTaiNguyenSuCo(SuCo.TaiNguyen)
        .filter((Muc) => CacId.includes(Muc.Id))
        .map((Muc) => ({
          LoaiTaiNguyen: Muc.Loai,
          TaiNguyenId: Muc.Id,
          TenTaiNguyen: Muc.Ten,
          LoaiXungDot: "SU_CO_CHUA_XU_LY" as const,
        })),
    ),
    ...CacCaTrungStudio.filter((CaQuay) => {
      if (
        CaQuay.PhongStudioId === PhongStudioId &&
        HaiKhoangGiaoNhau(
          {
            BatDau: CaQuay.StudioHieuLucTu ?? TaoKhoangHieuLuc(CaQuay).BatDau,
            KetThuc: TaoKhoangHieuLuc(CaQuay).KetThuc,
          },
          KhoangHieuLucChung,
        )
      )
        return true;
      return (
        Array.isArray(CaQuay.LichSuStudio) ? CaQuay.LichSuStudio : []
      ).some(
        (Muc) =>
          Muc &&
          typeof Muc === "object" &&
          !Array.isArray(Muc) &&
          Muc.Id === PhongStudioId &&
          typeof Muc.BatDau === "string" &&
          typeof Muc.KetThuc === "string" &&
          HaiKhoangGiaoNhau(
            { BatDau: new Date(Muc.BatDau), KetThuc: new Date(Muc.KetThuc) },
            KhoangHieuLucChung,
          ),
      );
    }).map((CaQuay) => ({
      LoaiTaiNguyen: LoaiTaiNguyen.STUDIO,
      TaiNguyenId: PhongStudioId as string,
      TenTaiNguyen: CaQuay.PhongStudio?.TenPhong ?? "",
      LoaiXungDot: "TRUNG_LICH_CA_QUAY" as const,
      CaQuayBiTrung: TaoThongTinCaQuay(CaQuay),
    })),
    ...CacCaTrungThietBi.filter((PhanCong) =>
      HaiKhoangGiaoNhau(
        TaoKhoangPhanCongThietBi(
          {
            ...PhanCong.CaQuay,
            ThoiGianKiemTraSauSuDungPhut:
              KiemTraTheoThietBi.get(PhanCong.ThietBiId) ?? 0,
          },
          PhanCong,
        ),
        TaoKhoangHieuLuc({
          ...ThamSo,
          ThoiGianKiemTraSauSuDungPhut:
            KiemTraTheoThietBi.get(PhanCong.ThietBiId) ?? 0,
        }),
      ),
    ).map(({ ThietBiId: ThietBiId, ThietBi: ThietBi, CaQuay: CaQuay }) => ({
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      TaiNguyenId: ThietBiId,
      TenTaiNguyen: ThietBi.TenThietBi,
      LoaiXungDot: "TRUNG_LICH_CA_QUAY" as const,
      CaQuayBiTrung: TaoThongTinCaQuay(CaQuay),
    })),
    ...CacCaTrungNhanSu.filter((CaQuay) =>
      KiemTraGiaoNhauVoiCa(CaQuay),
    ).flatMap((CaQuay) => {
      const NguoiBiTrung = new Map<string, string>();
      if (
        DanhSachNguoiCanKiemTraId.includes(CaQuay.NguoiPhuTrachId) &&
        (!CaQuay.NguoiPhuTrachHieuLucTu ||
          CaQuay.NguoiPhuTrachHieuLucTu < KhoangHieuLucChung.KetThuc)
      ) {
        NguoiBiTrung.set(CaQuay.NguoiPhuTrachId, CaQuay.NguoiPhuTrach.HoTen);
      }
      CaQuay.DanhSachNhanSu.forEach((PhanCong) => {
        if (
          HaiKhoangGiaoNhau(
            TaoKhoangPhanCongThietBi(CaQuay, PhanCong),
            KhoangHieuLucChung,
          )
        )
          NguoiBiTrung.set(PhanCong.NguoiDungId, PhanCong.NguoiDung.HoTen);
      });
      return [...NguoiBiTrung].map(([NguoiDungId, HoTen]) => ({
        LoaiTaiNguyen: LoaiTaiNguyen.NHAN_SU,
        TaiNguyenId: NguoiDungId,
        TenTaiNguyen: HoTen,
        LoaiXungDot: "TRUNG_LICH_CA_QUAY" as const,
        ViTriNguoi:
          NguoiDungId === NguoiPhuTrachId
            ? ("NGUOI_PHU_TRACH" as const)
            : ("NHAN_SU" as const),
        CaQuayBiTrung: TaoThongTinCaQuay(CaQuay),
      }));
    }),
    ...CacKhoangStudioKhongKhaDung.filter(KiemTraKhoangKhongKhaDung).map(
      (Khoang) => ({
        LoaiTaiNguyen: LoaiTaiNguyen.STUDIO,
        TaiNguyenId: Khoang.PhongStudioId,
        TenTaiNguyen: Khoang.PhongStudio.TenPhong,
        LoaiXungDot: "KHONG_KHA_DUNG" as const,
        KhoangKhongKhaDung: TaoThongTinKhoangKhongKhaDung(Khoang),
      }),
    ),
    ...CacKhoangThietBiKhongKhaDung.filter((Khoang) =>
      HaiKhoangGiaoNhau(
        TaoKhoangHieuLuc({
          ThoiGianBatDau: ThoiGianBatDau,
          ThoiGianKetThuc: ThoiGianKetThuc,
          ThoiGianChuanBiPhut: ThamSo.ThoiGianChuanBiPhut,
          ThoiGianThuHoiPhut: ThamSo.ThoiGianThuHoiPhut,
          ThoiGianKiemTraSauSuDungPhut:
            KiemTraTheoThietBi.get(Khoang.ThietBiId) ?? 0,
        }),
        Khoang,
      ),
    ).map((Khoang) => ({
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      TaiNguyenId: Khoang.ThietBiId,
      TenTaiNguyen: Khoang.ThietBi.TenThietBi,
      LoaiXungDot: "KHONG_KHA_DUNG" as const,
      KhoangKhongKhaDung: TaoThongTinKhoangKhongKhaDung(Khoang),
    })),
    ...CacKhoangNhanSuKhongKhaDung.filter(KiemTraKhoangKhongKhaDung).map(
      (Khoang) => ({
        LoaiTaiNguyen: LoaiTaiNguyen.NHAN_SU,
        TaiNguyenId: Khoang.NguoiDungId,
        TenTaiNguyen: Khoang.NguoiDung.HoTen,
        LoaiXungDot: "KHONG_KHA_DUNG" as const,
        ViTriNguoi:
          Khoang.NguoiDungId === NguoiPhuTrachId
            ? ("NGUOI_PHU_TRACH" as const)
            : ("NHAN_SU" as const),
        KhoangKhongKhaDung: TaoThongTinKhoangKhongKhaDung({
          ...Khoang,
          LyDo: Khoang.LyDo ? "Nhân sự đã báo không khả dụng." : null,
        }),
      }),
    ),
    ...(StudioDuocChon && StudioDuocChon.TrangThai !== TrangThaiStudio.SAN_SANG
      ? [
          {
            LoaiTaiNguyen: LoaiTaiNguyen.STUDIO,
            TaiNguyenId: StudioDuocChon.Id,
            TenTaiNguyen: StudioDuocChon.TenPhong,
            LoaiXungDot: "TRANG_THAI_KHONG_CHO_PHEP" as const,
            TrangThaiTaiNguyen: StudioDuocChon.TrangThai,
          },
        ]
      : []),
    ...CacLanChuaHoanTra.map((Muc) => ({
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      TaiNguyenId: Muc.ThietBiId,
      TenTaiNguyen: Muc.ThietBi.TenThietBi,
      LoaiXungDot: "CHUA_HOAN_TRA" as const,
      MuonTraQuaHan: {
        CaQuayId: Muc.CaQuay.Id,
        TieuDeCaQuay: Muc.CaQuay.TieuDe,
        ThoiGianKetThuc: Muc.CaQuay.ThoiGianKetThuc,
      },
    })),
    ...CacThietBiDuocChon.filter(
      (ThietBi) =>
        (!ThietBi.KhoId ||
          ThietBi.Kho?.DangHoatDong === false ||
          ThietBi.LichSuCaQuay.length > 0 ||
          ThietBi.TrangThai !== TrangThaiThietBi.SAN_SANG) &&
        !(
          ThietBi.TrangThai === TrangThaiThietBi.DANG_SU_DUNG &&
          (IdDangCoKhoanMuon.has(ThietBi.Id) ||
            IdDangDungCuaCaHienTai.has(ThietBi.Id))
        ),
    ).map((ThietBi) => ({
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      TaiNguyenId: ThietBi.Id,
      TenTaiNguyen: ThietBi.TenThietBi,
      LoaiXungDot: "TRANG_THAI_KHONG_CHO_PHEP" as const,
      TrangThaiTaiNguyen: ThietBi.TrangThai,
    })),
    ...CacSuCoChuaXuLy.map((SuCo) => ({
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      TaiNguyenId: SuCo.ThietBiId,
      TenTaiNguyen: SuCo.ThietBi.TenThietBi,
      LoaiXungDot: "SU_CO_CHUA_XU_LY" as const,
    })),
  ];

  return {
    CoXungDot: DanhSachXungDot.length > 0,
    DanhSachXungDot: DanhSachXungDot,
  };
}

async function BaoDamTaiNguyenKiemTraThuocDonVi(
  ThamSo: {
    PhongStudioId?: string | null;
    NguoiPhuTrachId?: string;
    DanhSachThietBiId: string[];
    DanhSachNhanSuId: string[];
    CaQuayHienTaiId?: string;
  },
  DonViId: string,
  Db: Prisma.TransactionClient,
) {
  const DanhSachNguoiDungId = [
    ...new Set([
      ...(ThamSo.NguoiPhuTrachId ? [ThamSo.NguoiPhuTrachId] : []),
      ...ThamSo.DanhSachNhanSuId,
    ]),
  ];
  const [Studio, SoThietBi, SoNhanSu, CaQuay] = await Promise.all([
    ThamSo.PhongStudioId
      ? Db.phongStudio.findFirst({
          where: { Id: ThamSo.PhongStudioId, DonViId: DonViId },
          select: { Id: true },
        })
      : Promise.resolve({ Id: "khong-co-studio" }),
    Db.thietBi.count({
      where: {
        Id: { in: ThamSo.DanhSachThietBiId },
        DanhMuc: { DonViId: DonViId },
      },
    }),
    Db.nguoiDung.count({
      where: { Id: { in: DanhSachNguoiDungId }, DonViId: DonViId },
    }),
    ThamSo.CaQuayHienTaiId
      ? Db.caQuay.findFirst({
          where: { Id: ThamSo.CaQuayHienTaiId, DuAn: { DonViId: DonViId } },
          select: { Id: true },
        })
      : Promise.resolve({ Id: "khong-co-ca-quay" }),
  ]);
  if (
    !Studio ||
    !CaQuay ||
    SoThietBi !== ThamSo.DanhSachThietBiId.length ||
    SoNhanSu !== DanhSachNguoiDungId.length
  ) {
    throw new LoiKhongTimThay("Tài nguyên không thuộc đơn vị");
  }
}

function TaoThongTinCaQuay(CaQuay: {
  Id: string;
  MaCaQuay: string | null;
  TieuDe: string;
  ThoiGianBatDau: Date;
  ThoiGianKetThuc: Date;
  ThoiGianChuanBiPhut: number;
  ThoiGianThuHoiPhut: number;
  TrangThai: TrangThaiCaQuay;
  MucDoUuTien: number;
}) {
  return {
    Id: CaQuay.Id,
    MaCaQuay: CaQuay.MaCaQuay,
    TieuDe: CaQuay.TieuDe,
    ThoiGianBatDau: CaQuay.ThoiGianBatDau,
    ThoiGianKetThuc: CaQuay.ThoiGianKetThuc,
    // Đệm của ca đang chặn: chiến lược đổi giờ cần để suy ra mốc thật sự trống.
    ThoiGianChuanBiPhut: CaQuay.ThoiGianChuanBiPhut,
    ThoiGianThuHoiPhut: CaQuay.ThoiGianThuHoiPhut,
    TrangThai: CaQuay.TrangThai,
    MucDoUuTien: CaQuay.MucDoUuTien,
  };
}

function TaoThongTinKhoangKhongKhaDung(Khoang: {
  Id: string;
  BatDau: Date;
  KetThuc: Date;
  LyDo: string | null;
}) {
  return {
    Id: Khoang.Id,
    BatDau: Khoang.BatDau,
    KetThuc: Khoang.KetThuc,
    LyDo: Khoang.LyDo,
  };
}
