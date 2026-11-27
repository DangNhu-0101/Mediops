import { KiemTraXungDotToanDien } from "./ThuatToanXungDotService.js";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { DocAnhSuCo, ThanhJson } from "./DuLieuNhungService.js";
import { TaiDanhSachAnhAnToan, type CongCuLuuTruAnh } from "./TaiAnhService.js";
import { Prisma, type TrangThaiSuCoVanHanh } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import type { NguoiDungXacThuc } from "../Types/index.js";
import { PhamViCaQuay } from "./QuyenService.js";
import { ThucHienGiaoDichLich } from "./GiaoDichLichService.js";
import { LoiVanHanhKho } from "./LoiNghiepVuService.js";
import { LayTrangThaiMoiKhiBaoSuCo } from "./SuCoBaoTriService.js";
import {
  BaoSuCoVanHanhSchema,
  DocTaiNguyenSuCo,
  NhanTrangThaiSuCo,
  type DuLieuBaoSuCoVanHanh,
} from "./HopDongSuCoVanHanh.js";
import { GoiYGiaiQuyetXungDot } from "./ThuatToanGiaiQuyetXungDotService.js";
import {
  DanhGiaYeuCauTaiNguyen,
  LayTaiNguyenDoiChieu,
  LayYeuCauCaQuay,
} from "./YeuCauTaiNguyenService.js";

export type PhamViSuCo = NguoiDungXacThuc & { DonViId: string };
async function ThemTenLichSu(
  DanhSach: BanGhiSuCo[],
  DonViId: string,
  Db: Prisma.TransactionClient,
) {
  const CacId = [
    ...new Set(
      DanhSach.flatMap((Muc) => [
        ...Muc.LichSu.map((Dong) => Dong.NguoiThucHienId),
        ...Muc.LoThayThe.map((Lo) => Lo.NguoiPhuTrachId),
      ]),
    ),
  ];
  const Nguoi = await Db.nguoiDung.findMany({
    where: { DonViId, Id: { in: CacId } },
    select: { Id: true, HoTen: true },
  });
  const Ten = new Map(Nguoi.map((Muc) => [Muc.Id, Muc.HoTen]));
  return DanhSach.map((Muc) => ({
    ...Muc,
    LoThayThe: Muc.LoThayThe.map((Lo) => ({
      ...Lo,
      NguoiPhuTrach: Ten.get(Lo.NguoiPhuTrachId) ?? "Người phụ trách trước đây",
    })),
    LichSu: Muc.LichSu.map((Dong) => ({
      ...Dong,
      NguoiThucHien: Ten.get(Dong.NguoiThucHienId) ?? "Người dùng trước đây",
    })),
  }));
}
function BaoLoi(NoiDung: string, Ma = 409): never {
  throw new LoiVanHanhKho(NoiDung, Ma, "SU_CO_VAN_HANH");
}
function CoQuyen(PhamVi: PhamViSuCo, Quyen: string) {
  return PhamVi.Quyen?.includes(Quyen) ?? false;
}
export function DieuKienXemSuCo(
  PhamVi: PhamViSuCo,
): Prisma.SuCoVanHanhWhereInput {
  return {
    DonViId: PhamVi.DonViId,
    ...(CoQuyen(PhamVi, "SuCo.Xem")
      ? {}
      : {
          OR: [
            { CaQuay: PhamViCaQuay(PhamVi.nguoiDungId) },
            { NguoiBaoCaoId: PhamVi.nguoiDungId },
          ],
        }),
  };
}
const LienKetSuCo = {
  LichSu: { orderBy: [{ NgayTao: "asc" as const }, { Id: "asc" as const }] },
  BaoTri: {
    select: { Id: true, ThietBiId: true, TrangThai: true, DanhSachAnh: true },
  },
  LoThayThe: {
    include: {
      DanhSachPhanCong: { select: { ThietBiId: true, TrangThaiMuonTra: true } },
    },
  },
  CaQuay: {
    select: {
      Id: true,
      TieuDe: true,
      DuAn: { select: { Id: true, TenDuAn: true } },
    },
  },
} satisfies Prisma.SuCoVanHanhInclude;
type BanGhiSuCo = Prisma.SuCoVanHanhGetPayload<{ include: typeof LienKetSuCo }>;
export async function LaySuCoVanHanh(
  Id: string,
  PhamVi: PhamViSuCo,
  Db: Prisma.TransactionClient = CoSoDuLieu,
) {
  const BanGhi = await Db.suCoVanHanh.findFirst({
    where: { Id, ...DieuKienXemSuCo(PhamVi) },
    include: LienKetSuCo,
  });
  const SuCo = BanGhi
    ? (await ThemTenLichSu([BanGhi], PhamVi.DonViId, Db))[0]
    : null;
  if (!SuCo) BaoLoi("Không tìm thấy sự cố được phép truy cập.", 404);
  return {
    ...SuCo,
    DanhSachAnh: DocAnhSuCo(SuCo.DanhSachAnh).map(
      ({ Id: MaAnh, SecureUrl, NgayTao }) => ({
        Id: MaAnh,
        SecureUrl,
        NgayTao,
      }),
    ),
    BaoTri: SuCo.BaoTri.map(({ DanhSachAnh: Anh, ...Muc }) => ({
      ...Muc,
      DanhSachAnh: DocAnhSuCo(Anh).map(({ Id: MaAnh, SecureUrl, NgayTao }) => ({
        Id: MaAnh,
        SecureUrl,
        NgayTao,
      })),
    })),
  };
}
export async function LayDanhSachSuCoVanHanh(
  PhamVi: PhamViSuCo,
  BoLoc: {
    CaQuayId?: string;
    ThietBiId?: string;
    DuAnId?: string;
    Trang: number;
  },
) {
  const DieuKien = {
    ...DieuKienXemSuCo(PhamVi),
    // Sự cố đã khôi phục hoặc báo nhầm không còn hiển thị; dữ liệu vẫn được lưu để truy vết.
    TrangThai: { in: ["MOI_BAO", "DA_XAC_MINH", "DANG_XU_LY"] },
    ...(BoLoc.CaQuayId ? { CaQuayId: BoLoc.CaQuayId } : {}),
    ...(BoLoc.DuAnId ? { CaQuay: { DuAnId: BoLoc.DuAnId } } : {}),
    ...(BoLoc.ThietBiId
      ? {
          OR: [
            { ThietBiId: BoLoc.ThietBiId },
            {
              TaiNguyen: {
                array_contains: [{ Loai: "THIET_BI", Id: BoLoc.ThietBiId }],
              },
            },
          ],
          AND: [DieuKienXemSuCo(PhamVi)],
        }
      : {}),
  } satisfies Prisma.SuCoVanHanhWhereInput;
  const [DanhSach, TongSo] = await Promise.all([
    CoSoDuLieu.suCoVanHanh.findMany({
      where: DieuKien,
      include: LienKetSuCo,
      orderBy: [{ NgayTao: "desc" }, { Id: "desc" }],
      take: 20,
      skip: (BoLoc.Trang - 1) * 20,
    }),
    CoSoDuLieu.suCoVanHanh.count({ where: DieuKien }),
  ]);
  const CoTen = await ThemTenLichSu(DanhSach, PhamVi.DonViId, CoSoDuLieu);
  const CanhBaoTraTre = await CoSoDuLieu.caQuayThietBi.findMany({
    where: {
      TrangThaiMuonTra: "DA_XUAT_KHO",
      ThoiGianNhapKho: null,
      ...(BoLoc.ThietBiId ? { ThietBiId: BoLoc.ThietBiId } : {}),
      CaQuay: {
        DuAn: { DonViId: PhamVi.DonViId },
        ThoiGianKetThuc: { lt: new Date() },
        ...(BoLoc.CaQuayId ? { Id: BoLoc.CaQuayId } : {}),
        ...(BoLoc.DuAnId ? { DuAnId: BoLoc.DuAnId } : {}),
        ...(CoQuyen(PhamVi, "CaQuay.Xem")
          ? {}
          : PhamViCaQuay(PhamVi.nguoiDungId)),
      },
    },
    select: {
      Id: true,
      ThietBi: { select: { TenThietBi: true } },
      CaQuay: { select: { TieuDe: true, ThoiGianKetThuc: true } },
    },
    take: 20,
    orderBy: { Id: "asc" },
  });
  return {
    CanhBaoTraTre,
    DanhSach: CoTen.map((Muc) => ({
      ...Muc,
      DanhSachAnh: DocAnhSuCo(Muc.DanhSachAnh).map(
        ({ Id, SecureUrl, NgayTao }) => ({ Id, SecureUrl, NgayTao }),
      ),
      BaoTri: Muc.BaoTri.map(({ DanhSachAnh: Anh, ...BaoTri }) => ({
        ...BaoTri,
        DanhSachAnh: DocAnhSuCo(Anh).map(({ Id, SecureUrl, NgayTao }) => ({
          Id,
          SecureUrl,
          NgayTao,
        })),
      })),
    })),
    TongSo,
  };
}
interface NguCanhBaoSuCo {
  CaQuayId?: string;
  CoTheBao: boolean;
  TenNguCanh: string;
  TaiNguyen: ReturnType<typeof DocTaiNguyenSuCo>;
}
export async function LayNguCanhBaoSuCo(
  PhamVi: PhamViSuCo,
  CaQuayId?: string,
  ThietBiId?: string,
  Db: Prisma.TransactionClient = CoSoDuLieu,
): Promise<NguCanhBaoSuCo> {
  if (CaQuayId) {
    const Ca = await Db.caQuay.findFirst({
      where: {
        Id: CaQuayId,
        DuAn: { DonViId: PhamVi.DonViId },
        ...(CoQuyen(PhamVi, "CaQuay.Xem")
          ? {}
          : PhamViCaQuay(PhamVi.nguoiDungId)),
      },
      include: {
        DanhSachThietBi: { include: { ThietBi: true } },
        DanhSachNhanSu: {
          include: { NguoiDung: { select: { Id: true, HoTen: true } } },
        },
        NguoiPhuTrach: { select: { Id: true, HoTen: true } },
        PhongStudio: true,
      },
    });
    if (!Ca) BaoLoi("Không được báo sự cố cho ca quay này.", 403);
    return {
      CaQuayId: Ca.Id,
      CoTheBao:
        CoQuyen(PhamVi, "SuCo.Tao") ||
        Ca.NguoiPhuTrachId === PhamVi.nguoiDungId ||
        Ca.DanhSachNhanSu.some((Muc) => Muc.NguoiDungId === PhamVi.nguoiDungId),
      TenNguCanh: Ca.TieuDe,
      TaiNguyen: [
        ...Ca.DanhSachThietBi.map((Muc) => ({
          Loai: "THIET_BI" as const,
          Id: Muc.ThietBiId,
          Ten: Muc.ThietBi.TenThietBi,
        })),
        ...[
          ...new Map(
            [
              {
                Id: Ca.NguoiPhuTrach.Id,
                Ten: `${Ca.NguoiPhuTrach.HoTen} · Người phụ trách ca`,
              },
              ...Ca.DanhSachNhanSu.map((Muc) => ({
                Id: Muc.NguoiDungId,
                Ten: `${Muc.NguoiDung.HoTen} · ${Muc.ChucDanhPhanCong}`,
              })),
            ].map((Muc) => [Muc.Id, Muc]),
          ).values(),
        ].map((Muc) => ({ ...Muc, Loai: "NHAN_SU" as const })),
        ...(Ca.PhongStudio
          ? [
              {
                Loai: "STUDIO" as const,
                Id: Ca.PhongStudio.Id,
                Ten: Ca.PhongStudio.TenPhong,
              },
            ]
          : []),
      ],
    };
  }
  if (ThietBiId) {
    const KhoanMuon = await Db.caQuayThietBi.findFirst({
      where: {
        ThietBiId,
        TrangThaiMuonTra: "DA_XUAT_KHO",
        ThoiGianNhapKho: null,
        CaQuay: {
          DuAn: { DonViId: PhamVi.DonViId },
          ...(CoQuyen(PhamVi, "CaQuay.Xem")
            ? {}
            : PhamViCaQuay(PhamVi.nguoiDungId)),
        },
      },
      select: { CaQuayId: true },
      orderBy: { Id: "asc" },
    });
    if (KhoanMuon)
      return LayNguCanhBaoSuCo(PhamVi, KhoanMuon.CaQuayId, undefined, Db);
  }
  if (
    !ThietBiId ||
    !CoQuyen(PhamVi, "SuCo.Tao") ||
    !CoQuyen(PhamVi, "ThietBi.Xem")
  )
    BaoLoi("Cần ca được phân công hoặc quyền báo sự cố thiết bị.", 403);
  const May = await Db.thietBi.findFirst({
    where: { Id: ThietBiId, DanhMuc: { DonViId: PhamVi.DonViId } },
  });
  if (!May) BaoLoi("Không tìm thấy thiết bị.", 404);
  return {
    CoTheBao: true,
    TenNguCanh: May.TenThietBi,
    TaiNguyen: [{ Loai: "THIET_BI" as const, Id: May.Id, Ten: May.TenThietBi }],
  };
}
export async function BaoSuCoVanHanh(
  DauVao: DuLieuBaoSuCoVanHanh,
  PhamVi: PhamViSuCo,
) {
  const DuLieu = BaoSuCoVanHanhSchema.parse(DauVao);
  return ThucHienGiaoDichLich(async (Db) => {
    const NguCanh = await LayNguCanhBaoSuCo(
      PhamVi,
      DuLieu.CaQuayId,
      DuLieu.ThietBiId,
      Db,
    );
    if (!NguCanh.CoTheBao)
      BaoLoi(
        "Chỉ người được phân công hoặc có quyền báo sự cố mới được báo trong ca này.",
        403,
      );
    if (new Date(DuLieu.ThoiDiemXayRa).getTime() > Date.now() + 30000)
      BaoLoi("Thời điểm xảy ra không được ở tương lai.", 400);
    const TaiNguyen = DuLieu.TaiNguyen.map((Muc) => {
      const HopLe = NguCanh.TaiNguyen.find(
        (Cu) => Cu.Id === Muc.Id && Cu.Loai === Muc.Loai,
      );
      if (!HopLe) BaoLoi("Tài nguyên không thuộc ca hoặc ngữ cảnh báo.", 422);
      return { ...Muc, Ten: HopLe.Ten };
    });
    const Cu = await Db.suCoVanHanh.findUnique({
      where: {
        DonViId_NguoiBaoCaoId_MaYeuCau: {
          DonViId: PhamVi.DonViId,
          NguoiBaoCaoId: PhamVi.nguoiDungId,
          MaYeuCau: DuLieu.MaYeuCau,
        },
      },
    });
    if (Cu) return LaySuCoVanHanh(Cu.Id, PhamVi, Db);
    const { MucDoThietBi, ...BanGhi } = DuLieu;
    const SuCo = await Db.suCoVanHanh.create({
      data: {
        ...BanGhi,
        CaQuayId: NguCanh.CaQuayId,
        TaiNguyen,
        DonViId: PhamVi.DonViId,
        NguoiBaoCaoId: PhamVi.nguoiDungId,
        LichSu: {
          create: {
            NguoiThucHienId: PhamVi.nguoiDungId,
            NoiDung: "Ghi nhận sự cố",
            ThayDoi: BanGhi,
          },
        },
      },
    });
    // Mọi sự cố làm ảnh hưởng thiết bị đều vào danh sách Sự cố và bảo trì.
    const KhongPhaiHong = !(DuLieu.NguyenNhan === "HONG" && MucDoThietBi);
    if (DuLieu.MucAnhHuong !== "VAN_QUAY_DUOC" || !KhongPhaiHong) {
      for (const Muc of TaiNguyen.filter((Muc) => Muc.Loai === "THIET_BI")) {
        const May = await Db.thietBi.findUniqueOrThrow({
          where: { Id: Muc.Id },
        });
        await Db.suCoBaoTri.create({
          data: {
            SuCoVanHanhId: SuCo.Id,
            ThietBiId: May.Id,
            CaQuayId: NguCanh.CaQuayId,
            KhoId: May.KhoId,
            NguoiBaoCaoId: PhamVi.nguoiDungId,
            Nguon: NguCanh.CaQuayId
              ? "TRONG_QUA_TRINH_SU_DUNG"
              : "KIEM_TRA_KHO",
            MucDo: MucDoThietBi ?? "NGHIEM_TRONG",
            MoTaLoi: KhongPhaiHong
              ? `Sự cố ca quay: ${DuLieu.MoTa}`
              : DuLieu.MoTa,
          },
        });
        if (MucDoThietBi && !KhongPhaiHong)
          await Db.thietBi.update({
            where: { Id: May.Id },
            data: {
              TrangThai: LayTrangThaiMoiKhiBaoSuCo(May.TrangThai, MucDoThietBi),
            },
          });
      }
    }
    return LaySuCoVanHanh(SuCo.Id, PhamVi, Db);
  }).catch(async (Loi: unknown) => {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    ) {
      const DaGhi = await CoSoDuLieu.suCoVanHanh.findUnique({
        where: {
          DonViId_NguoiBaoCaoId_MaYeuCau: {
            DonViId: PhamVi.DonViId,
            NguoiBaoCaoId: PhamVi.nguoiDungId,
            MaYeuCau: DuLieu.MaYeuCau,
          },
        },
      });
      if (DaGhi) return LaySuCoVanHanh(DaGhi.Id, PhamVi);
    }
    throw Loi;
  });
}
export async function CapNhatSuCoVanHanh(
  Id: string,
  DuLieu: {
    TrangThai: TrangThaiSuCoVanHanh;
    NoiDung: string;
    KetThucAnhHuong: string | null;
    DuKienPhucHoi: string | null;
  },
  PhamVi: PhamViSuCo,
) {
  if (!CoQuyen(PhamVi, "SuCo.Sua"))
    BaoLoi("Bạn không có quyền xử lý sự cố.", 403);
  return ThucHienGiaoDichLich(async (Db) => {
    const SuCo = await LaySuCoVanHanh(Id, PhamVi, Db);
    const ChuyenTiep: Record<TrangThaiSuCoVanHanh, TrangThaiSuCoVanHanh[]> = {
      MOI_BAO: ["DA_XAC_MINH", "DA_HUY"],
      DA_XAC_MINH: ["DANG_XU_LY", "DA_HUY"],
      DANG_XU_LY: ["DA_KHOI_PHUC", "DA_HUY"],
      DA_KHOI_PHUC: [],
      DA_HUY: [],
    };
    if (
      DuLieu.TrangThai !== SuCo.TrangThai &&
      !ChuyenTiep[SuCo.TrangThai].includes(DuLieu.TrangThai)
    )
      BaoLoi("Chuyển trạng thái sự cố không hợp lệ.");
    if (["DA_KHOI_PHUC", "DA_HUY"].includes(SuCo.TrangThai))
      BaoLoi("Sự cố đã đóng; lịch sử được giữ nguyên.");
    if (
      DuLieu.KetThucAnhHuong &&
      new Date(DuLieu.KetThucAnhHuong) <= SuCo.ThoiDiemXayRa
    )
      BaoLoi("Khoảng gián đoạn không hợp lệ.", 400);
    if (
      DuLieu.TrangThai === "DA_KHOI_PHUC" &&
      SuCo.LoThayThe.some((Lo) => !Lo.ThoiDiemBanGiao)
    )
      BaoLoi("Cần xác nhận bàn giao và kiểm tra máy thay trước khi khôi phục.");
    const KetThuc =
      DuLieu.TrangThai === "DA_KHOI_PHUC" || DuLieu.TrangThai === "DA_HUY"
        ? new Date()
        : DuLieu.KetThucAnhHuong
          ? new Date(DuLieu.KetThucAnhHuong)
          : null;
    // Báo nhầm: đóng phiếu bảo trì tạo kèm. Phiếu do sự cố hỏng đã đổi trạng thái máy nên được giữ nguyên.
    if (DuLieu.TrangThai === "DA_HUY" && SuCo.NguyenNhan !== "HONG")
      await Db.suCoBaoTri.updateMany({
        where: { SuCoVanHanhId: Id, TrangThai: { not: "DA_KHAC_PHUC" } },
        data: { TrangThai: "DA_KHAC_PHUC", NgayHoanTat: new Date() },
      });
    await Db.suCoVanHanh.update({
      where: { Id },
      data: {
        TrangThai: DuLieu.TrangThai,
        KetThucAnhHuong: KetThuc,
        DuKienPhucHoi: DuLieu.DuKienPhucHoi
          ? new Date(DuLieu.DuKienPhucHoi)
          : null,
        LichSu: {
          create: {
            NguoiThucHienId: PhamVi.nguoiDungId,
            NoiDung: `${NhanTrangThaiSuCo[DuLieu.TrangThai]}: ${DuLieu.NoiDung}`,
            ThayDoi: DuLieu,
          },
        },
      },
    });
    return LaySuCoVanHanh(Id, PhamVi, Db);
  });
}

function Bam(DuLieu: unknown) {
  return createHash("sha256").update(JSON.stringify(DuLieu)).digest("hex");
}
export async function ThemAnhSuCoVanHanh(
  Id: string,
  MaLanTai: string,
  Tep: Express.Multer.File[],
  PhamVi: PhamViSuCo,
  CongCu?: CongCuLuuTruAnh,
) {
  const SuCo = await LaySuCoVanHanh(Id, PhamVi);
  if (SuCo.NguoiBaoCaoId !== PhamVi.nguoiDungId && !CoQuyen(PhamVi, "SuCo.Sua"))
    BaoLoi("Không có quyền bổ sung ảnh.", 403);
  if (!Tep.length || Tep.length > 5) BaoLoi("Chọn từ 1 đến 5 ảnh.", 400);
  if (
    await CoSoDuLieu.nhatKySuCoVanHanh.findFirst({
      where: { SuCoId: Id, ThayDoi: { path: ["MaLanTai"], equals: MaLanTai } },
    })
  )
    return LaySuCoVanHanh(Id, PhamVi);
  return TaiDanhSachAnhAnToan({
    DanhSachTep: Tep,
    ThuMuc: `mediops/su-co/${SuCo.BaoTri[0]?.Id ?? Id}`,
    CongCu,
    LuuVaoCoSoDuLieu: (Anh) =>
      ThucHienGiaoDichLich(async (Db) => {
        const HienTai = await LaySuCoVanHanh(Id, PhamVi, Db);
        const BaoTri = HienTai.BaoTri[0];
        const BanGhi = BaoTri
          ? await Db.suCoBaoTri.findUniqueOrThrow({ where: { Id: BaoTri.Id } })
          : await Db.suCoVanHanh.findUniqueOrThrow({ where: { Id } });
        const AnhCu = DocAnhSuCo(BanGhi.DanhSachAnh);
        if (AnhCu.length + Anh.length > 5)
          BaoLoi("Mỗi sự cố chỉ có tối đa 5 ảnh.", 400);
        // Yêu cầu ảnh lặp bị từ chối để công cụ dọn ảnh vừa tải sau rollback.
        if (
          await Db.nhatKySuCoVanHanh.findFirst({
            where: {
              SuCoId: Id,
              ThayDoi: { path: ["MaLanTai"], equals: MaLanTai },
            },
          })
        )
          BaoLoi("Ảnh đã được lưu; hãy tải lại sự cố.");
        const DanhSachAnh = ThanhJson([
          ...AnhCu,
          ...Anh.map((Muc) => ({
            Id: randomUUID(),
            ...Muc,
            NgayTao: new Date().toISOString(),
          })),
        ]);
        if (BaoTri)
          await Db.suCoBaoTri.update({
            where: { Id: BaoTri.Id },
            data: { DanhSachAnh },
          });
        else
          await Db.suCoVanHanh.update({ where: { Id }, data: { DanhSachAnh } });
        await Db.nhatKySuCoVanHanh.create({
          data: {
            SuCoId: Id,
            NguoiThucHienId: PhamVi.nguoiDungId,
            NoiDung: "Bổ sung ảnh sự cố",
            ThayDoi: { MaLanTai },
          },
        });
        return LaySuCoVanHanh(Id, PhamVi, Db);
      }),
  });
}
export async function PhanTichAnhHuongSuCo(
  Id: string,
  HieuLuc: Date,
  PhamVi: PhamViSuCo,
  Db: Prisma.TransactionClient = CoSoDuLieu,
) {
  const SuCo = await LaySuCoVanHanh(Id, PhamVi, Db);
  const TaiNguyen = DocTaiNguyenSuCo(SuCo.TaiNguyen);
  if (!SuCo.CaQuayId)
    return {
      SuCoId: Id,
      CanhBao: "Sự cố thiết bị tại kho; bảo trì được xử lý độc lập.",
      DanhSachPhuongAn: [],
      CaLienQuan: [],
      DanhGiaYeuCau: null,
      MaPhienBan: Bam(SuCo),
      MocQuyetDinh: null,
    };
  const Ca = await Db.caQuay.findUniqueOrThrow({
    where: { Id: SuCo.CaQuayId },
    include: { DanhSachThietBi: true, DanhSachNhanSu: true },
  });
  const CoPhanConLai =
    HieuLuc < Ca.ThoiGianKetThuc && HieuLuc >= Ca.ThoiGianBatDau;
  const KetQua = CoPhanConLai
    ? await GoiYGiaiQuyetXungDot(Ca.Id, PhamVi.DonViId, Db, { HieuLuc })
    : { MaPhienBan: Bam(Ca), DanhSachPhuongAn: [] };
  const BiAnhHuong = new Set(
    SuCo.MucAnhHuong === "VAN_QUAY_DUOC" ? [] : TaiNguyen.map((Muc) => Muc.Id),
  );
  const ThietBi = Ca.DanhSachThietBi.filter(
    (Muc) => !Muc.HieuLucDen && !BiAnhHuong.has(Muc.ThietBiId),
  ).map((Muc) => Muc.ThietBiId);
  const NhanSu = [
    ...new Set([
      Ca.NguoiPhuTrachId,
      ...Ca.DanhSachNhanSu.map((Muc) => Muc.NguoiDungId),
    ]),
  ].filter((Ma) => !BiAnhHuong.has(Ma));
  const DanhGiaYeuCau = DanhGiaYeuCauTaiNguyen(
    await LayYeuCauCaQuay(Ca.Id, PhamVi.DonViId, Db),
    await LayTaiNguyenDoiChieu(
      {
        DonViId: PhamVi.DonViId,
        DanhSachThietBiId: ThietBi,
        DanhSachNhanSuId: NhanSu,
        PhongStudioId: BiAnhHuong.has(Ca.PhongStudioId ?? "")
          ? null
          : Ca.PhongStudioId,
      },
      Db,
    ),
  );
  const CaUngVien = await Db.caQuay.findMany({
    where: {
      DuAn: { DonViId: PhamVi.DonViId },
      Id: { not: Ca.Id },
      TrangThai: { in: ["DA_DUYET", "DANG_DIEN_RA"] },
      ThoiGianKetThuc: { gt: SuCo.ThoiDiemXayRa },
      AND: [
        CoQuyen(PhamVi, "CaQuay.Xem") ? {} : PhamViCaQuay(PhamVi.nguoiDungId),
        {
          OR: [
            {
              DanhSachThietBi: {
                some: {
                  ThietBiId: {
                    in: TaiNguyen.filter((Muc) => Muc.Loai === "THIET_BI").map(
                      (Muc) => Muc.Id,
                    ),
                  },
                },
              },
            },
            {
              NguoiPhuTrachId: {
                in: TaiNguyen.filter((Muc) => Muc.Loai === "NHAN_SU").map(
                  (Muc) => Muc.Id,
                ),
              },
            },
            {
              DanhSachNhanSu: {
                some: {
                  NguoiDungId: {
                    in: TaiNguyen.filter((Muc) => Muc.Loai === "NHAN_SU").map(
                      (Muc) => Muc.Id,
                    ),
                  },
                },
              },
            },
            {
              PhongStudioId: {
                in: TaiNguyen.filter((Muc) => Muc.Loai === "STUDIO").map(
                  (Muc) => Muc.Id,
                ),
              },
            },
          ],
        },
      ],
    },
    select: {
      Id: true,
      TieuDe: true,
      ThoiGianBatDau: true,
      ThoiGianKetThuc: true,
    },
    take: 20,
    orderBy: { ThoiGianBatDau: "asc" },
  });
  // Một lần gọi detector theo khoảng ảnh hưởng, rồi ghép ca theo mã; không chạy truy vấn riêng cho từng ca.
  const KetThucRaSoat =
    SuCo.KetThucAnhHuong ??
    new Date(
      Math.max(
        +Ca.ThoiGianKetThuc,
        ...CaUngVien.map((Muc) => +Muc.ThoiGianKetThuc),
        +SuCo.ThoiDiemXayRa + 1,
      ),
    );
  const AnhHuongLich = BiAnhHuong.size
    ? await KiemTraXungDotToanDien(
        {
          DonViId: PhamVi.DonViId,
          CaQuayHienTaiId: Ca.Id,
          ThoiGianBatDau: SuCo.ThoiDiemXayRa,
          ThoiGianKetThuc: KetThucRaSoat,
          DanhSachThietBiId: TaiNguyen.filter(
            (Muc) => Muc.Loai === "THIET_BI",
          ).map((Muc) => Muc.Id),
          DanhSachNhanSuId: TaiNguyen.filter(
            (Muc) => Muc.Loai === "NHAN_SU",
          ).map((Muc) => Muc.Id),
          PhongStudioId: TaiNguyen.find((Muc) => Muc.Loai === "STUDIO")?.Id,
        },
        Db,
      )
    : { DanhSachXungDot: [] };
  const CacCaBiAnhHuong = new Set(
    AnhHuongLich.DanhSachXungDot.flatMap((Muc) =>
      Muc.CaQuayBiTrung ? [Muc.CaQuayBiTrung.Id] : [],
    ),
  );
  const CaLienQuan = CaUngVien.filter((Muc) => CacCaBiAnhHuong.has(Muc.Id));
  if (!CoQuyen(PhamVi, "CaQuay.Xem")) {
    for (const PhuongAn of KetQua.DanhSachPhuongAn) {
      PhuongAn.XungDotConLai = PhuongAn.XungDotConLai.map(
        ({ CaQuayBiTrung, MuonTraQuaHan, KhoangKhongKhaDung, ...Muc }) => ({
          ...Muc,
          ...(KhoangKhongKhaDung
            ? {
                KhoangKhongKhaDung: {
                  ...KhoangKhongKhaDung,
                  LyDo: "Có khoảng không khả dụng đã xác nhận.",
                },
              }
            : {}),
        }),
      );
      PhuongAn.XungDotDaGiaiQuyet = [];
    }
  }
  const DanhSachPhuongAn = KetQua.DanhSachPhuongAn.filter(
    (Muc) => !Muc.ThayDoi.ThoiGian,
  )
    .slice(0, 3)
    .map((Muc) => ({
      ...Muc,
      ApDungDuoc:
        Muc.ApDungDuoc &&
        Muc.XungDotConLai.length === 0 &&
        Muc.DanhGiaYeuCau?.DapUngBatBuoc !== false &&
        !!(
          Muc.ThayDoi.NhanSu?.length ||
          Muc.ThayDoi.NguoiPhuTrach ||
          Muc.ThayDoi.Studio ||
          Muc.ThayDoi.ThietBi?.length
        ) &&
        ["MOI_BAO", "DA_XAC_MINH", "DANG_XU_LY"].includes(SuCo.TrangThai),
      GiaiThich: `${Muc.GiaiThich} ${Muc.ThayDoi.NhanSu?.length || Muc.ThayDoi.NguoiPhuTrach ? "Cần gửi lời mời tới người được chọn, nhận đồng ý rồi người điều phối chốt." : Muc.ThayDoi.Studio ? "Cần xác nhận địa điểm và thời gian bàn giao trước khi chốt." : "Cần xác nhận thời gian bàn giao. Khả dụng có thể thay đổi trước khi áp dụng."}`,
    }));
  return {
    SuCoId: Id,
    DanhSachPhuongAn,
    DanhGiaYeuCau,
    CaLienQuan,
    MocQuyetDinh:
      CaLienQuan[0]?.ThoiGianBatDau ??
      (Ca.ThoiGianKetThuc > new Date() ? Ca.ThoiGianKetThuc : null),
    MaPhienBan: Bam({
      SuCo,
      PhienBan: KetQua.MaPhienBan,
      HieuLuc,
      DanhSachPhuongAn,
    }),
    CanhBao: !CoPhanConLai
      ? "Mốc đã chọn ngoài thời gian ca: chỉ phân tích ảnh hưởng và thu hồi, không thay máy vào phần lịch đã kết thúc. Chọn mốc trong phần ca chưa thực hiện nếu cần thay thiết bị."
      : SuCo.KetThucAnhHuong
        ? "Chỉ đánh giá khoảng gián đoạn đã xác nhận."
        : "Chưa rõ thời điểm phục hồi; cần rà soát, chưa thể khẳng định khả dụng sau thời gian dự kiến.",
  };
}

export async function ApDungThayThietBiSuCo(
  Id: string,
  DuLieu: {
    HieuLuc: string;
    PhuongAnId: string;
    MaPhienBan: string;
    NguoiPhuTrachId: string;
    XacNhanGiaoNhan: boolean;
  },
  PhamVi: PhamViSuCo,
) {
  if (!CoQuyen(PhamVi, "SuCo.Sua") || !CoQuyen(PhamVi, "CaQuay.PhanCong"))
    BaoLoi("Thiếu quyền xử lý sự cố và phân công.", 403);
  return ThucHienGiaoDichLich(async (Db) => {
    const HieuLuc = new Date(DuLieu.HieuLuc);
    if (HieuLuc < new Date() || !DuLieu.XacNhanGiaoNhan)
      BaoLoi("Xác nhận mốc bàn giao trong phần ca chưa thực hiện.", 400);
    const SuCo = await LaySuCoVanHanh(Id, PhamVi, Db);
    const PhanTich = await PhanTichAnhHuongSuCo(Id, HieuLuc, PhamVi, Db);
    if (PhanTich.MaPhienBan !== DuLieu.MaPhienBan)
      BaoLoi("Dữ liệu đã thay đổi; hãy phân tích lại.");
    const PhuongAn = PhanTich.DanhSachPhuongAn.find(
      (Muc) => Muc.Id === DuLieu.PhuongAnId,
    );
    if (
      !PhuongAn?.ApDungDuoc ||
      !SuCo.CaQuayId ||
      PhuongAn.ThayDoi.NhanSu?.length ||
      PhuongAn.ThayDoi.NguoiPhuTrach ||
      PhuongAn.ThayDoi.Studio ||
      PhuongAn.ThayDoi.ThietBiBoSung?.length
    )
      BaoLoi("Phương án không thể áp dụng.");
    const Nguoi = await Db.nguoiDung.findFirst({
      where: {
        Id: DuLieu.NguoiPhuTrachId,
        DonViId: PhamVi.DonViId,
        OR: [
          { CaQuayPhuTrach: { some: { Id: SuCo.CaQuayId } } },
          { CaQuayThamGia: { some: { CaQuayId: SuCo.CaQuayId } } },
        ],
      },
    });
    if (!Nguoi)
      BaoLoi(
        "Người chịu trách nhiệm thu hồi/bàn giao phải được phân công trong ca.",
        422,
      );
    const Lo = await Db.loThayTheThietBi.create({
      data: { SuCoId: Id, NguoiPhuTrachId: Nguoi.Id, ThoiDiemHieuLuc: HieuLuc },
    });
    const MayMoi = (PhuongAn.ThayDoi.ThietBi ?? []).map((Muc) => Muc.DenId);
    if (new Set(MayMoi).size !== MayMoi.length)
      BaoLoi("Một thiết bị không thể thay cho nhiều vị trí cùng lúc.");
    for (const Muc of PhuongAn.ThayDoi.ThietBi ?? []) {
      if (!Muc.DenId || Muc.Nguon !== "NOI_BO")
        BaoLoi("Chỉ áp dụng thay thiết bị nội bộ.");
      const Cu = await Db.caQuayThietBi.findUnique({
        where: {
          CaQuayId_ThietBiId: { CaQuayId: SuCo.CaQuayId, ThietBiId: Muc.TuId },
        },
      });
      if (!Cu || Cu.HieuLucDen || Cu.TrangThaiMuonTra === "DA_NHAP_KHO")
        BaoLoi("Phân công cũ đã thay đổi.");
      await Db.caQuayThietBi.update({
        where: { Id: Cu.Id },
        data: { HieuLucDen: HieuLuc },
      });
      await Db.caQuayThietBi.create({
        data: {
          CaQuayId: SuCo.CaQuayId,
          ThietBiId: Muc.DenId,
          HieuLucTu: HieuLuc,
          LoThayTheId: Lo.Id,
        },
      });
    }
    await Db.nhatKySuCoVanHanh.create({
      data: {
        SuCoId: Id,
        NguoiThucHienId: PhamVi.nguoiDungId,
        NoiDung: `Chọn phương án: ${PhuongAn.TieuDe}. ${Nguoi.HoTen} chịu trách nhiệm thu hồi máy cũ và bàn giao.`,
        ThayDoi: JSON.parse(
          JSON.stringify({
            PhuongAn,
            LoThayTheId: Lo.Id,
            HieuLuc: DuLieu.HieuLuc,
          }),
        ) as Prisma.InputJsonValue,
      },
    });
    return Lo;
  });
}
export async function XacNhanBanGiaoSuCo(
  Id: string,
  LoId: string,
  NoiDung: string,
  PhamVi: PhamViSuCo,
) {
  if (!CoQuyen(PhamVi, "SuCo.Sua")) BaoLoi("Thiếu quyền xử lý sự cố.", 403);
  return ThucHienGiaoDichLich(async (Db) => {
    const SuCo = await LaySuCoVanHanh(Id, PhamVi, Db);
    const Lo = SuCo.LoThayThe.find((Muc) => Muc.Id === LoId);
    if (
      !Lo ||
      Lo.DanhSachPhanCong.some(
        (Muc) => Muc.TrangThaiMuonTra !== "DA_XUAT_KHO",
      ) ||
      Lo.ThoiDiemHieuLuc > new Date()
    )
      BaoLoi("Cần xuất đầy đủ lô thay thế và đến thời điểm bàn giao.");
    if (Lo.ThoiDiemBanGiao) return Lo;
    await Db.loThayTheThietBi.update({
      where: { Id: LoId },
      data: { ThoiDiemBanGiao: new Date() },
    });
    await Db.nhatKySuCoVanHanh.create({
      data: {
        SuCoId: Id,
        NguoiThucHienId: PhamVi.nguoiDungId,
        NoiDung: `Đã bàn giao và kiểm tra: ${NoiDung}`,
      },
    });
    return LaySuCoVanHanh(Id, PhamVi, Db);
  });
}
