import { PhamViCaQuay } from "./QuyenService.js";
import { CapNhatCaQuayTrongGiaoDich } from "./CaQuayService.js";
import { GoiYGiaiQuyetXungDot } from "./ThuatToanGiaiQuyetXungDotService.js";
import { createHash } from "node:crypto";
import { Prisma, type PhienQuyetDinh } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { ThucHienGiaoDichLich } from "./GiaoDichLichService.js";
import { LoiVanHanhKho } from "./LoiNghiepVuService.js";
import {
  LaySuCoVanHanh,
  PhanTichAnhHuongSuCo,
  type PhamViSuCo,
} from "./SuCoVanHanhService.js";
import { LayThoiGianCho } from "./CauHinhThoiGianChoService.js";
import { TrongPhienGiuCho } from "./NguCanhGiuChoService.js";
import {
  KiemTraPhuongAnVanHanh,
  type PhuongAnGiaiQuyet,
  type ThayDoiGiaiQuyet,
} from "./ThuatToanGiaiQuyetXungDotService.js";
import { TaoKhoangHieuLuc } from "./ThoiGianHieuLucService.js";
import { ThanhJson } from "./DuLieuNhungService.js";
import { ViTriNguoiPhuTrachCa } from "./PhanCongChucVuService.js";

function BaoLoi(NoiDung: string, Ma = 409): never {
  throw new LoiVanHanhKho(NoiDung, Ma, "PHIEN_QUYET_DINH");
}
function KiemTraQuyen(PhamVi: PhamViSuCo, LaXepLich = false) {
  if (
    (!LaXepLich && !PhamVi.Quyen?.includes("SuCo.Sua")) ||
    !PhamVi.Quyen?.includes("CaQuay.PhanCong")
  )
    BaoLoi("Cần quyền xử lý sự cố và phân công ca.", 403);
}
export async function LayDauVanTay(CaId: string, Db: Prisma.TransactionClient) {
  const Ca = await Db.caQuay.findUniqueOrThrow({
    where: { Id: CaId },
    include: {
      DanhSachNhanSu: { orderBy: { Id: "asc" } },
      DanhSachThietBi: { orderBy: { Id: "asc" } },
      SuCoVanHanh: { orderBy: { Id: "asc" } },
    },
  });
  return createHash("sha256").update(JSON.stringify(Ca)).digest("hex");
}
type KetQuaPhien = Omit<
  Awaited<ReturnType<typeof PhanTichAnhHuongSuCo>>,
  "DanhSachPhuongAn" | "DanhGiaYeuCau"
> & {
  DanhSachPhuongAn: PhuongAnGiaiQuyet[];
  DanhGiaYeuCau: import("./YeuCauTaiNguyenService.js").DanhGiaYeuCau | null;
};
// Kết quả lưu trước khi đổi "đạo diễn" thành "người phụ trách ca" dùng khóa cũ; ánh xạ khi đọc.
interface ThayDoiDaLuuCu {
  DaoDien?: {
    TuId: string;
    TenDaoDienGoc: string;
    DenId: string;
    TenDaoDienMoi: string;
  };
}
function ChuanHoaPhuongAnDaLuu(PhuongAn: PhuongAnGiaiQuyet) {
  const ThayDoiCu = PhuongAn.ThayDoi as ThayDoiGiaiQuyet & ThayDoiDaLuuCu;
  if (ThayDoiCu.DaoDien && !ThayDoiCu.NguoiPhuTrach) {
    const { DaoDien, ...ConLai } = ThayDoiCu;
    PhuongAn.ThayDoi = {
      ...ConLai,
      NguoiPhuTrach: {
        TuId: DaoDien.TuId,
        TenNguoiGoc: DaoDien.TenDaoDienGoc,
        DenId: DaoDien.DenId,
        TenNguoiMoi: DaoDien.TenDaoDienMoi,
      },
    };
  }
  if ((PhuongAn.LoaiChienLuoc as string) === "DOI_DAO_DIEN")
    PhuongAn.LoaiChienLuoc = "DOI_NGUOI_PHU_TRACH";
}
function DocKetQua(Phien: PhienQuyetDinh): KetQuaPhien {
  // Dữ liệu này chỉ do server ghi từ kết quả engine, không nhận JSON từ client.
  const KetQua = Phien.KetQua as unknown as KetQuaPhien;
  for (const Muc of KetQua.DanhSachPhuongAn) ChuanHoaPhuongAnDaLuu(Muc);
  for (const Muc of KetQua.DanhSachPhuongAn)
    if (Muc.ThayDoi.ThoiGian)
      Muc.ThayDoi.ThoiGian = {
        BatDau: new Date(Muc.ThayDoi.ThoiGian.BatDau),
        KetThuc: new Date(Muc.ThayDoi.ThoiGian.KetThuc),
      };
  return KetQua;
}
function NguoiCanMoi(ThayDoi: ThayDoiGiaiQuyet) {
  return [
    ...(ThayDoi.NhanSu ?? []).map((Muc) => ({
      NguoiNhanId: Muc.DenId,
      NguoiCuId: Muc.TuId,
      ChucDanhPhanCong: Muc.ChucDanhPhanCong,
    })),
    ...(ThayDoi.NguoiPhuTrach
      ? [
          {
            NguoiNhanId: ThayDoi.NguoiPhuTrach.DenId,
            NguoiCuId: ThayDoi.NguoiPhuTrach.TuId,
            ChucDanhPhanCong: ViTriNguoiPhuTrachCa,
          },
        ]
      : []),
  ];
}
async function LayPhien(
  Id: string,
  PhamVi: PhamViSuCo,
  Db: Prisma.TransactionClient,
) {
  const Phien = await Db.phienQuyetDinh.findFirst({
    where: { Id, DonViId: PhamVi.DonViId },
  });
  if (!Phien) BaoLoi("Không tìm thấy phiên quyết định.", 404);
  KiemTraQuyen(PhamVi, !Phien.SuCoId);
  if (Phien.SuCoId) await LaySuCoVanHanh(Phien.SuCoId, PhamVi, Db);
  else await LayCaQuyetDinh(Phien.CaQuayId, PhamVi, Db);
  return Phien;
}
async function KiemTraNoiDung(
  Phien: PhienQuyetDinh,
  Db: Prisma.TransactionClient,
) {
  const Ca = await Db.caQuay.findUniqueOrThrow({
    where: { Id: Phien.CaQuayId },
  });
  return (
    !["DA_HUY", "HOAN_THANH"].includes(Ca.TrangThai) &&
    Phien.DauVanTay === (await LayDauVanTay(Ca.Id, Db))
  );
}
async function KetThucPhien(
  Phien: PhienQuyetDinh,
  NguoiId: string,
  Db: Prisma.TransactionClient,
  TrangThai = "DA_HUY",
) {
  await Db.phienQuyetDinh.update({
    where: { Id: Phien.Id },
    data: { TrangThai },
  });
  await Db.giuChoTaiNguyen.updateMany({
    where: { PhienId: Phien.Id, TrangThai: "MO" },
    data: { TrangThai },
  });
  const LoiMoi = await Db.loiMoiThayCa.findMany({
    where: {
      PhienId: Phien.Id,
      TrangThai: { in: ["CHO_PHAN_HOI", "DA_DONG_Y"] },
    },
  });
  for (const Muc of LoiMoi)
    await DoiTrangThaiMoi(
      Muc.Id,
      TrangThai === "HET_HAN" ? "HET_HAN" : "DA_HUY",
      NguoiId,
      Db,
    );
}
async function DoiTrangThaiMoi(
  Id: string,
  TrangThai: string,
  NguoiId: string,
  Db: Prisma.TransactionClient,
  TrangThaiLichSu = TrangThai,
) {
  return Db.loiMoiThayCa.update({
    where: { Id },
    data: {
      TrangThai,
      LichSu: {
        create: { NguoiThucHienId: NguoiId, TrangThai: TrangThaiLichSu },
      },
    },
  });
}
async function TraPhien(Phien: PhienQuyetDinh, Db: Prisma.TransactionClient) {
  const Ca = await Db.caQuay.findUniqueOrThrow({
    where: { Id: Phien.CaQuayId },
    select: {
      NguoiPhuTrach: { select: { Id: true, HoTen: true } },
      DanhSachNhanSu: {
        where: { HieuLucDen: null },
        select: { NguoiDung: { select: { Id: true, HoTen: true } } },
      },
    },
  });
  const GiuCho = await Db.giuChoTaiNguyen.findMany({
    where: { PhienId: Phien.Id },
    select: {
      TaiNguyenId: true,
      Loai: true,
      BatDau: true,
      KetThuc: true,
      HetHanLuc: true,
      TrangThai: true,
    },
  });
  const [May, Studio] = await Promise.all([
    Db.thietBi.findMany({
      where: {
        Id: {
          in: GiuCho.filter((Muc) => Muc.Loai === "THIET_BI").map(
            (Muc) => Muc.TaiNguyenId,
          ),
        },
        DanhMuc: { DonViId: Phien.DonViId },
      },
      select: { Id: true, TenThietBi: true, MaQR: true },
    }),
    Db.phongStudio.findMany({
      where: {
        Id: {
          in: GiuCho.filter((Muc) => Muc.Loai === "STUDIO").map(
            (Muc) => Muc.TaiNguyenId,
          ),
        },
        DonViId: Phien.DonViId,
      },
      select: { Id: true, TenPhong: true },
    }),
  ]);
  return {
    NguoiPhuTrach: [
      ...new Map(
        [
          Ca.NguoiPhuTrach,
          ...Ca.DanhSachNhanSu.map((Muc) => Muc.NguoiDung),
        ].map((Muc) => [Muc.Id, Muc]),
      ).values(),
    ],
    ...DocKetQua(Phien),
    PhienId: Phien.Id,
    HieuLuc: Phien.HieuLuc,
    HetHanLuc: Phien.HetHanLuc,
    TrangThaiPhien: Phien.TrangThai,
    NoiDungConHieuLuc: await KiemTraNoiDung(Phien, Db),
    GiuCho: GiuCho.map((Muc) => {
      const TenMay = May.find((Dong) => Dong.Id === Muc.TaiNguyenId);
      return {
        ...Muc,
        TenTaiNguyen: TenMay
          ? TenMay.TenThietBi + " · " + TenMay.MaQR
          : (Studio.find((Dong) => Dong.Id === Muc.TaiNguyenId)?.TenPhong ??
            "Tài nguyên đã thay đổi"),
      };
    }),
    LoiMoi: await Db.loiMoiThayCa.findMany({
      where: { PhienId: Phien.Id },
      select: {
        Id: true,
        PhuongAnId: true,
        NguoiNhanId: true,
        ChucDanhPhanCong: true,
        TrangThai: true,
        HetHanLuc: true,
        CoMatLuc: true,
      },
    }),
    GioMayChu: new Date(),
  };
}
export async function DocPhienSuCo(SuCoId: string, PhamVi: PhamViSuCo) {
  KiemTraQuyen(PhamVi);
  const SuCo = await LaySuCoVanHanh(SuCoId, PhamVi);
  const Phien = await CoSoDuLieu.phienQuyetDinh.findFirst({
    where: {
      DonViId: PhamVi.DonViId,
      CaQuayId: SuCo.CaQuayId ?? "",
      TrangThai: "MO",
    },
    orderBy: { NgayTao: "desc" },
  });
  return Phien ? TraPhien(Phien, CoSoDuLieu) : null;
}
export async function TaoPhienSuCo(
  SuCoId: string,
  HieuLuc: Date,
  TaoLai: boolean,
  PhamVi: PhamViSuCo,
  LaXepLich = false,
) {
  KiemTraQuyen(PhamVi, LaXepLich);
  return ThucHienGiaoDichLich(async (Db) => {
    const SuCo = LaXepLich
      ? {
          CaQuayId: (await LayCaQuyetDinh(SuCoId, PhamVi, Db)).Id,
          TrangThai: "DA_XAC_MINH",
        }
      : await LaySuCoVanHanh(SuCoId, PhamVi, Db);
    if (
      !SuCo.CaQuayId ||
      !["MOI_BAO", "DA_XAC_MINH", "DANG_XU_LY"].includes(SuCo.TrangThai)
    )
      BaoLoi("Cần ca quay và sự cố đang mở.");
    const Ca = await Db.caQuay.findUniqueOrThrow({
      where: { Id: SuCo.CaQuayId },
    });
    if (
      ["DA_HUY", "HOAN_THANH"].includes(Ca.TrangThai) ||
      HieuLuc < new Date() ||
      HieuLuc < Ca.ThoiGianBatDau ||
      HieuLuc >= Ca.ThoiGianKetThuc
    )
      BaoLoi("Chọn mốc trong phần công việc chưa thực hiện.");
    const Cu = await Db.phienQuyetDinh.findFirst({
      where: { CaQuayId: Ca.Id, DonViId: PhamVi.DonViId, TrangThai: "MO" },
    });
    if (Cu && !TaoLai && Cu.HetHanLuc > new Date()) return TraPhien(Cu, Db);
    if (Cu)
      await KetThucPhien(
        Cu,
        PhamVi.nguoiDungId,
        Db,
        Cu.HetHanLuc <= new Date() ? "HET_HAN" : "DA_HUY",
      );
    const GoiY = LaXepLich
      ? await GoiYGiaiQuyetXungDot(Ca.Id, PhamVi.DonViId, Db)
      : null;
    const KetQua: KetQuaPhien = GoiY
      ? {
          SuCoId: "",
          CanhBao: GoiY.ThongBao,
          DanhSachPhuongAn: GoiY.DanhSachPhuongAn,
          CaLienQuan: [],
          DanhGiaYeuCau: null,
          MaPhienBan: GoiY.MaPhienBan,
          MocQuyetDinh: Ca.ThoiGianBatDau,
        }
      : await PhanTichAnhHuongSuCo(SuCoId, HieuLuc, PhamVi, Db);
    const CauHinh = await LayThoiGianCho(Db);
    const HienTai = new Date();
    const Phien = await Db.phienQuyetDinh.create({
      data: {
        DonViId: PhamVi.DonViId,
        CaQuayId: Ca.Id,
        SuCoId: LaXepLich ? "" : SuCoId,
        NguoiTaoId: PhamVi.nguoiDungId,
        HieuLuc,
        HetHanLuc: new Date(
          Math.min(
            +Ca.ThoiGianKetThuc,
            +HienTai + Math.max(...Object.values(CauHinh)) * 60000,
          ),
        ),
        KetQua: ThanhJson(KetQua),
        DauVanTay: await LayDauVanTay(Ca.Id, Db),
      },
    });
    const HopLe: PhuongAnGiaiQuyet[] = [];
    await TrongPhienGiuCho(Phien.Id, async () => {
      for (const PhuongAn of KetQua.DanhSachPhuongAn.slice(0, 3)) {
        const DuDieuKien =
          PhuongAn.ApDungDuoc &&
          (await KiemTraPhuongAnVanHanh(
            Ca.Id,
            PhamVi.DonViId,
            HieuLuc,
            PhuongAn.ThayDoi,
            Db,
            LaXepLich,
          ));
        PhuongAn.ApDungDuoc = DuDieuKien;
        if (DuDieuKien)
          await GiuTaiNguyen(Phien, PhuongAn, CauHinh, HienTai, Db);
        HopLe.push(PhuongAn);
      }
    });
    KetQua.DanhSachPhuongAn = HopLe;
    const DaLuu = await Db.phienQuyetDinh.update({
      where: { Id: Phien.Id },
      data: { KetQua: ThanhJson(KetQua) },
    });
    return TraPhien(DaLuu, Db);
  });
}
async function GiuTaiNguyen(
  Phien: PhienQuyetDinh,
  PhuongAn: PhuongAnGiaiQuyet,
  CauHinh: Awaited<ReturnType<typeof LayThoiGianCho>>,
  HienTai: Date,
  Db: Prisma.TransactionClient,
) {
  const Ca = await Db.caQuay.findUniqueOrThrow({
    where: { Id: Phien.CaQuayId },
    include: { DanhSachThietBi: { where: { HieuLucDen: null } } },
  });
  const TaiNguyen = [
    ...(PhuongAn.ThayDoi.ThoiGian
      ? Ca.DanhSachThietBi.filter(
          (Cu) =>
            !PhuongAn.ThayDoi.ThietBi?.some((Muc) => Muc.TuId === Cu.ThietBiId),
        ).map((Muc) => ({ Loai: "THIET_BI" as const, Id: Muc.ThietBiId }))
      : []),
    ...(PhuongAn.ThayDoi.ThoiGian &&
    !PhuongAn.ThayDoi.Studio &&
    Ca.PhongStudioId
      ? [{ Loai: "STUDIO" as const, Id: Ca.PhongStudioId }]
      : []),
    ...(PhuongAn.ThayDoi.ThietBi ?? []).flatMap((Muc) =>
      Muc.DenId ? [{ Loai: "THIET_BI" as const, Id: Muc.DenId }] : [],
    ),
    ...(PhuongAn.ThayDoi.ThietBiBoSung ?? []).map((Muc) => ({
      Loai: "THIET_BI" as const,
      Id: Muc.Id,
    })),
    ...(PhuongAn.ThayDoi.Studio
      ? [{ Loai: "STUDIO" as const, Id: PhuongAn.ThayDoi.Studio.DenId }]
      : []),
  ];
  const May = await Db.thietBi.findMany({
    where: {
      Id: {
        in: TaiNguyen.filter((Muc) => Muc.Loai === "THIET_BI").map(
          (Muc) => Muc.Id,
        ),
      },
      DanhMuc: { DonViId: Phien.DonViId },
    },
    select: { Id: true, ThoiGianKiemTraSauSuDungPhut: true },
  });
  for (const Muc of TaiNguyen) {
    if (
      !PhuongAn.ThayDoi.ThoiGian &&
      Muc.Loai === "THIET_BI" &&
      Ca.DanhSachThietBi.some((Cu) => Cu.ThietBiId === Muc.Id)
    )
      continue;
    const Khoang = TaoKhoangHieuLuc({
      ...Ca,
      ThoiGianBatDau: PhuongAn.ThayDoi.ThoiGian?.BatDau ?? Phien.HieuLuc,
      ThoiGianKetThuc: PhuongAn.ThayDoi.ThoiGian?.KetThuc ?? Ca.ThoiGianKetThuc,
      ThoiGianChuanBiPhut: Phien.SuCoId ? 0 : Ca.ThoiGianChuanBiPhut,
      ThoiGianKiemTraSauSuDungPhut: May.find((Cu) => Cu.Id === Muc.Id)
        ?.ThoiGianKiemTraSauSuDungPhut,
    });
    await Db.giuChoTaiNguyen.upsert({
      where: {
        PhienId_Loai_TaiNguyenId_BatDau_KetThuc: {
          PhienId: Phien.Id,
          Loai: Muc.Loai,
          TaiNguyenId: Muc.Id,
          ...Khoang,
        },
      },
      create: {
        PhienId: Phien.Id,
        DonViId: Phien.DonViId,
        Loai: Muc.Loai,
        TaiNguyenId: Muc.Id,
        ...Khoang,
        HetHanLuc: new Date(+HienTai + CauHinh[Muc.Loai] * 60000),
      },
      update: {
        TrangThai: "MO",
        ...Khoang,
        HetHanLuc: new Date(+HienTai + CauHinh[Muc.Loai] * 60000),
      },
    });
  }
}
export async function HuyPhien(Id: string, PhamVi: PhamViSuCo) {
  return ThucHienGiaoDichLich(async (Db) => {
    const Phien = await LayPhien(Id, PhamVi, Db);
    if (Phien.TrangThai === "MO")
      await KetThucPhien(Phien, PhamVi.nguoiDungId, Db);
  });
}
export async function GuiLoiMoi(
  Id: string,
  PhuongAnId: string,
  NguoiNhan: string[],
  GhiChu: string,
  PhamVi: PhamViSuCo,
) {
  return ThucHienGiaoDichLich(async (Db) => {
    const Phien = await LayPhien(Id, PhamVi, Db);
    if (
      Phien.TrangThai !== "MO" ||
      Phien.HetHanLuc <= new Date() ||
      !(await KiemTraNoiDung(Phien, Db))
    )
      BaoLoi(
        "Phiên hoặc nội dung công việc đã hết hiệu lực; hãy tìm lại phương án.",
      );
    const PhuongAn = DocKetQua(Phien).DanhSachPhuongAn.find(
      (Muc) => Muc.Id === PhuongAnId,
    );
    if (!PhuongAn?.ApDungDuoc)
      BaoLoi("Không thể gửi lời mời cho phương án này.");
    const Ca = await Db.caQuay.findUniqueOrThrow({
      where: { Id: Phien.CaQuayId },
      include: { DuAn: true, PhongStudio: true },
    });
    const BatDauCongViec = PhuongAn.ThayDoi.ThoiGian?.BatDau ?? Phien.HieuLuc;
    const KetThucCongViec =
      PhuongAn.ThayDoi.ThoiGian?.KetThuc ?? Ca.ThoiGianKetThuc;
    const Han = new Date(
      Math.min(
        +KetThucCongViec,
        Date.now() + (await LayThoiGianCho(Db)).NHAN_SU * 60000,
      ),
    );
    const CacNguoi = NguoiCanMoi(PhuongAn.ThayDoi);
    if (
      !NguoiNhan.length ||
      new Set(NguoiNhan).size !== NguoiNhan.length ||
      NguoiNhan.some((Ma) => !CacNguoi.some((Muc) => Muc.NguoiNhanId === Ma))
    )
      BaoLoi("Chọn đúng người nhận từ phương án.", 400);
    for (const Nguoi of CacNguoi.filter((Muc) =>
      NguoiNhan.includes(Muc.NguoiNhanId),
    )) {
      await Db.loiMoiThayCa.upsert({
        where: {
          PhienId_PhuongAnId_NguoiNhanId: {
            PhienId: Id,
            PhuongAnId,
            NguoiNhanId: Nguoi.NguoiNhanId,
          },
        },
        create: {
          ...Nguoi,
          DonViId: PhamVi.DonViId,
          PhienId: Id,
          PhuongAnId,
          NguoiGuiId: PhamVi.nguoiDungId,
          HetHanLuc: Han,
          GhiChuBanGiao: GhiChu,
          NoiDung: {
            TenCa: Ca.TieuDe,
            TenDuAn: Ca.DuAn.TenDuAn,
            DiaDiem:
              Ca.PhongStudio?.DiaDiem ??
              Ca.GhiChuDiaDiem ??
              "Cần xác nhận địa điểm",
            BatDau: BatDauCongViec.toISOString(),
            KetThuc: KetThucCongViec.toISOString(),
          },
          LichSu: {
            create: {
              NguoiThucHienId: PhamVi.nguoiDungId,
              TrangThai: "CHO_PHAN_HOI",
            },
          },
        },
        update: {},
      });
    }
    return TraPhien(Phien, Db);
  });
}
export async function LayLoiMoiCuaToi(PhamVi: PhamViSuCo, Trang = 1) {
  const DanhSach = await CoSoDuLieu.loiMoiThayCa.findMany({
    where: { DonViId: PhamVi.DonViId, NguoiNhanId: PhamVi.nguoiDungId },
    include: { Phien: true, LichSu: { orderBy: { NgayTao: "asc" } } },
    orderBy: { HetHanLuc: "desc" },
    take: 20,
    skip: (Trang - 1) * 20,
  });
  return Promise.all(
    DanhSach.map(
      async ({
        Phien,
        NguoiCuId,
        DonViId,
        NguoiGuiId,
        PhuongAnId,
        ...Muc
      }) => ({
        ...Muc,
        TrangThai: ["CHO_PHAN_HOI", "DA_DONG_Y"].includes(Muc.TrangThai)
          ? !(await KiemTraNoiDung(Phien, CoSoDuLieu)) ||
            Phien.TrangThai !== "MO"
            ? "DA_HUY"
            : Muc.HetHanLuc <= new Date() || Phien.HetHanLuc <= new Date()
              ? "HET_HAN"
              : Muc.TrangThai
          : Muc.TrangThai,
        LichSu: Muc.LichSu.map(({ TrangThai, NgayTao }) => ({
          TrangThai,
          NgayTao,
        })),
      }),
    ),
  );
}
export async function PhanHoiLoiMoi(
  Id: string,
  TraLoi: "DA_DONG_Y" | "DA_TU_CHOI" | "RUT_DONG_Y",
  CoMatLuc: Date | undefined,
  PhamVi: PhamViSuCo,
) {
  return ThucHienGiaoDichLich(async (Db) => {
    const Moi = await Db.loiMoiThayCa.findFirst({
      where: { Id, DonViId: PhamVi.DonViId, NguoiNhanId: PhamVi.nguoiDungId },
      include: { Phien: true },
    });
    if (!Moi) BaoLoi("Không tìm thấy lời mời của bạn.", 404);
    if (Moi.HetHanLuc <= new Date() || Moi.Phien.HetHanLuc <= new Date())
      BaoLoi("Lời mời đã hết hạn.");
    if (Moi.Phien.TrangThai !== "MO" || !(await KiemTraNoiDung(Moi.Phien, Db)))
      BaoLoi("Công việc đã thay đổi hoặc lời mời đã hủy. Cần lời mời mới.");
    if (Moi.TrangThai === TraLoi) return;
    if (
      !(Moi.TrangThai === "CHO_PHAN_HOI" && TraLoi !== "RUT_DONG_Y") &&
      !(Moi.TrangThai === "DA_DONG_Y" && TraLoi === "RUT_DONG_Y")
    )
      BaoLoi("Không thể đổi phản hồi ở trạng thái hiện tại.");
    if (
      TraLoi === "DA_DONG_Y" &&
      CoMatLuc &&
      CoMatLuc > GioCanCoMat(Moi.NoiDung, Moi.Phien.HieuLuc)
    )
      BaoLoi(
        "Giờ sớm nhất có mặt phải không muộn hơn thời điểm cần bàn giao.",
        422,
      );
    await DoiTrangThaiMoi(
      Id,
      TraLoi === "RUT_DONG_Y" ? "DA_HUY" : TraLoi,
      PhamVi.nguoiDungId,
      Db,
      TraLoi,
    );
    await Db.loiMoiThayCa.update({
      where: { Id },
      data: {
        PhanHoiLuc: new Date(),
        CoMatLuc:
          TraLoi === "DA_DONG_Y"
            ? (CoMatLuc ?? GioCanCoMat(Moi.NoiDung, Moi.Phien.HieuLuc))
            : null,
      },
    });
  });
}
export async function RutLoiMoi(Id: string, PhamVi: PhamViSuCo) {
  return ThucHienGiaoDichLich(async (Db) => {
    const Moi = await Db.loiMoiThayCa.findFirst({
      where: { Id, DonViId: PhamVi.DonViId },
    });
    if (!Moi) BaoLoi("Không tìm thấy lời mời.", 404);
    await LayPhien(Moi.PhienId, PhamVi, Db);
    if (["CHO_PHAN_HOI", "DA_DONG_Y"].includes(Moi.TrangThai))
      await DoiTrangThaiMoi(Id, "DA_HUY", PhamVi.nguoiDungId, Db);
  });
}
export async function ChotPhuongAn(
  Id: string,
  PhuongAnId: string,
  NguoiPhuTrachId: string,
  XacNhanGiaoNhan: boolean,
  PhamVi: PhamViSuCo,
) {
  return ThucHienGiaoDichLich(async (Db) => {
    const Phien = await LayPhien(Id, PhamVi, Db);
    if (Phien.TrangThai === "DA_CHOT" && Phien.PhuongAnDaChot === PhuongAnId)
      return { DaChot: true };
    if (
      Phien.TrangThai !== "MO" ||
      Phien.HetHanLuc <= new Date() ||
      !(await KiemTraNoiDung(Phien, Db))
    )
      BaoLoi(
        "Phiên hoặc nội dung công việc đã hết hiệu lực; hãy tìm phương án lại.",
      );
    const PhuongAn = DocKetQua(Phien).DanhSachPhuongAn.find(
      (Muc) => Muc.Id === PhuongAnId,
    );
    if (!PhuongAn?.ApDungDuoc || !XacNhanGiaoNhan)
      BaoLoi("Cần phương án đạt yêu cầu và xác nhận thời gian bàn giao.");
    const Ca = await Db.caQuay.findUniqueOrThrow({
      where: { Id: Phien.CaQuayId },
      include: { DanhSachNhanSu: true, PhongStudio: true },
    });
    if (
      Ca.NguoiPhuTrachId !== NguoiPhuTrachId &&
      !Ca.DanhSachNhanSu.some(
        (Muc) => Muc.NguoiDungId === NguoiPhuTrachId && !Muc.HieuLucDen,
      )
    )
      BaoLoi("Người phụ trách phải được phân công trong ca.", 422);
    const Moi = await Db.loiMoiThayCa.findMany({
      where: { PhienId: Id, PhuongAnId },
    });
    for (const Nguoi of NguoiCanMoi(PhuongAn.ThayDoi)) {
      if (
        !Moi.some(
          (Muc) =>
            Muc.NguoiNhanId === Nguoi.NguoiNhanId &&
            Muc.TrangThai === "DA_DONG_Y" &&
            Muc.HetHanLuc > new Date() &&
            Muc.CoMatLuc &&
            Muc.CoMatLuc <=
              (PhuongAn.ThayDoi.ThoiGian?.BatDau ?? Phien.HieuLuc),
        )
      )
        BaoLoi(
          "Chờ đúng người nhận lời và đủ thời gian có mặt trước khi chốt.",
        );
    }
    const GiuCho = await Db.giuChoTaiNguyen.findMany({
      where: { PhienId: Id, TrangThai: "MO" },
    });
    const CanGiu = [
      ...(PhuongAn.ThayDoi.ThietBi ?? []).flatMap((Muc) =>
        Muc.DenId ? [Muc.DenId] : [],
      ),
      ...(PhuongAn.ThayDoi.ThietBiBoSung ?? []).map((Muc) => Muc.Id),
      ...(PhuongAn.ThayDoi.Studio ? [PhuongAn.ThayDoi.Studio.DenId] : []),
    ];
    const CanGiuLai = CanGiu.some(
      (Ma) =>
        !GiuCho.some(
          (Muc) => Muc.TaiNguyenId === Ma && Muc.HetHanLuc > new Date(),
        ),
    );
    await TrongPhienGiuCho(Id, async () => {
      if (
        !(await KiemTraPhuongAnVanHanh(
          Ca.Id,
          PhamVi.DonViId,
          Phien.HieuLuc,
          PhuongAn.ThayDoi,
          Db,
          !Phien.SuCoId,
        ))
      )
        BaoLoi(
          "Phương án vừa mất khả dụng hoặc không còn đáp ứng; hãy tìm lại.",
        );
    });
    if (CanGiuLai)
      await GiuTaiNguyen(
        Phien,
        PhuongAn,
        await LayThoiGianCho(Db),
        new Date(),
        Db,
      );
    const MayMoi = [
      ...(PhuongAn.ThayDoi.ThietBi ?? []).flatMap((Muc) =>
        Muc.DenId ? [Muc.DenId] : [],
      ),
      ...(PhuongAn.ThayDoi.ThietBiBoSung ?? []).map((Muc) => Muc.Id),
    ];
    if (new Set(MayMoi).size !== MayMoi.length)
      BaoLoi("Một thiết bị không thể thay nhiều vị trí.");
    if (!Phien.SuCoId) {
      const ThayTheMay = new Map(
        (PhuongAn.ThayDoi.ThietBi ?? []).map((Muc) => [Muc.TuId, Muc.DenId!]),
      );
      const NguoiMoi = new Map(
        (PhuongAn.ThayDoi.NhanSu ?? []).map((Muc) => [Muc.TuId, Muc.DenId]),
      );
      const MayCu = await Db.caQuayThietBi.findMany({
        where: { CaQuayId: Ca.Id, HieuLucDen: null },
      });
      await TrongPhienGiuCho(Id, () =>
        CapNhatCaQuayTrongGiaoDich(
          Db,
          Ca.Id,
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
            DanhSachThietBiId: [
              ...MayCu.map(
                (Muc) => ThayTheMay.get(Muc.ThietBiId) ?? Muc.ThietBiId,
              ),
              ...(PhuongAn.ThayDoi.ThietBiBoSung ?? []).map((Muc) => Muc.Id),
            ],
            DanhSachNhanSu: Ca.DanhSachNhanSu.map((Muc) => ({
              NguoiDungId: NguoiMoi.get(Muc.NguoiDungId) ?? Muc.NguoiDungId,
              ChucDanhPhanCong: Muc.ChucDanhPhanCong,
            })),
          },
          PhamVi.DonViId,
        ),
      );
    } else {
      if (MayMoi.length) {
        const Lo = await Db.loThayTheThietBi.create({
          data: {
            SuCoId: Phien.SuCoId,
            NguoiPhuTrachId,
            ThoiDiemHieuLuc: Phien.HieuLuc,
          },
        });
        for (const Muc of PhuongAn.ThayDoi.ThietBi ?? [])
          await Db.caQuayThietBi.update({
            where: {
              CaQuayId_ThietBiId: { CaQuayId: Ca.Id, ThietBiId: Muc.TuId },
            },
            data: { HieuLucDen: Phien.HieuLuc },
          });
        await Db.caQuayThietBi.createMany({
          data: MayMoi.map((ThietBiId) => ({
            CaQuayId: Ca.Id,
            ThietBiId,
            HieuLucTu: Phien.HieuLuc,
            LoThayTheId: Lo.Id,
          })),
        });
      }
      for (const Muc of PhuongAn.ThayDoi.NhanSu ?? []) {
        await Db.caQuayNhanSu.update({
          where: {
            CaQuayId_NguoiDungId: { CaQuayId: Ca.Id, NguoiDungId: Muc.TuId },
          },
          data: { HieuLucDen: Phien.HieuLuc },
        });
        await Db.caQuayNhanSu.create({
          data: {
            CaQuayId: Ca.Id,
            NguoiDungId: Muc.DenId,
            ChucDanhPhanCong: Muc.ChucDanhPhanCong,
            HieuLucTu: Phien.HieuLuc,
          },
        });
      }
      if (PhuongAn.ThayDoi.NguoiPhuTrach) {
        await Db.caQuayNhanSu.upsert({
          where: {
            CaQuayId_NguoiDungId: {
              CaQuayId: Ca.Id,
              NguoiDungId: Ca.NguoiPhuTrachId,
            },
          },
          create: {
            CaQuayId: Ca.Id,
            NguoiDungId: Ca.NguoiPhuTrachId,
            ChucDanhPhanCong: ViTriNguoiPhuTrachCa,
            HieuLucTu: Ca.NguoiPhuTrachHieuLucTu,
            HieuLucDen: Phien.HieuLuc,
          },
          update: { HieuLucDen: Phien.HieuLuc },
        });
        await Db.caQuay.update({
          where: { Id: Ca.Id },
          data: {
            NguoiPhuTrachId: PhuongAn.ThayDoi.NguoiPhuTrach.DenId,
            NguoiPhuTrachHieuLucTu: Phien.HieuLuc,
          },
        });
      }
      if (PhuongAn.ThayDoi.Studio) {
        const LichSu = Array.isArray(Ca.LichSuStudio) ? Ca.LichSuStudio : [];
        await Db.caQuay.update({
          where: { Id: Ca.Id },
          data: {
            PhongStudioId: PhuongAn.ThayDoi.Studio.DenId,
            StudioHieuLucTu: Phien.HieuLuc,
            LichSuStudio: [
              ...LichSu,
              {
                Id: Ca.PhongStudioId,
                Ten: Ca.PhongStudio?.TenPhong,
                BatDau: (Ca.StudioHieuLucTu ?? Ca.ThoiGianBatDau).toISOString(),
                KetThuc: Phien.HieuLuc.toISOString(),
              },
            ],
          },
        });
      }
    }
    for (const Muc of Moi.filter((Muc) => Muc.TrangThai === "DA_DONG_Y"))
      await DoiTrangThaiMoi(Muc.Id, "DA_PHAN_CONG", PhamVi.nguoiDungId, Db);
    await KetThucPhien(Phien, PhamVi.nguoiDungId, Db, "DA_CHOT");
    await Db.phienQuyetDinh.update({
      where: { Id },
      data: { PhuongAnDaChot: PhuongAnId },
    });
    if (Phien.SuCoId)
      await Db.nhatKySuCoVanHanh.create({
        data: {
          SuCoId: Phien.SuCoId,
          NguoiThucHienId: PhamVi.nguoiDungId,
          NoiDung: `Chốt phân công: ${PhuongAn.TieuDe}. Chờ bàn giao và kiểm tra; máy cũ vẫn cần thu hồi.`,
          ThayDoi: ThanhJson({ PhuongAn, HieuLuc: Phien.HieuLuc }),
        },
      });
    return { DaChot: true };
  });
}

// Dọn lịch sử là phụ trợ: mọi quyết định vẫn kiểm tra HetHanLuc ngay trong truy vấn.
export async function DonPhienHetHan() {
  return ThucHienGiaoDichLich(async (Db) => {
    const HienTai = new Date();
    const Phien = await Db.phienQuyetDinh.findMany({
      where: {
        TrangThai: "MO",
        OR: [
          { HetHanLuc: { lte: HienTai } },
          { Ca: { TrangThai: { in: ["DA_HUY", "HOAN_THANH"] } } },
        ],
      },
      take: 100,
    });
    for (const Muc of Phien)
      await KetThucPhien(Muc, Muc.NguoiTaoId, Db, "HET_HAN");
    await Db.giuChoTaiNguyen.updateMany({
      where: { TrangThai: "MO", HetHanLuc: { lte: HienTai } },
      data: { TrangThai: "HET_HAN" },
    });
    const LoiMoi = await Db.loiMoiThayCa.findMany({
      where: {
        TrangThai: { in: ["CHO_PHAN_HOI", "DA_DONG_Y"] },
        HetHanLuc: { lte: HienTai },
      },
      take: 100,
    });
    for (const Muc of LoiMoi)
      await DoiTrangThaiMoi(Muc.Id, "HET_HAN", Muc.NguoiGuiId, Db);
  });
}

async function LayCaQuyetDinh(
  Id: string,
  PhamVi: PhamViSuCo,
  Db: Prisma.TransactionClient = CoSoDuLieu,
) {
  KiemTraQuyen(PhamVi, true);
  const Ca = await Db.caQuay.findFirst({
    where: {
      Id,
      DuAn: { DonViId: PhamVi.DonViId },
      ...(PhamVi.Quyen?.includes("CaQuay.Xem")
        ? {}
        : PhamViCaQuay(PhamVi.nguoiDungId)),
    },
  });
  if (!Ca) BaoLoi("Không tìm thấy ca được phép xử lý.", 404);
  return Ca;
}
export async function TaoPhienCaQuay(
  Id: string,
  TaoLai: boolean,
  PhamVi: PhamViSuCo,
) {
  const Ca = await LayCaQuyetDinh(Id, PhamVi);
  if (Ca.TrangThai === "DANG_DIEN_RA") {
    // Ca đang quay: dùng sự cố đang mở của ca, thay tài nguyên có hiệu lực từ ngay bây giờ; bàn giao máy làm sau.
    const SuCo = await CoSoDuLieu.suCoVanHanh.findFirst({
      where: {
        CaQuayId: Id,
        DonViId: PhamVi.DonViId,
        TrangThai: { in: ["MOI_BAO", "DA_XAC_MINH", "DANG_XU_LY"] },
      },
      orderBy: { NgayTao: "desc" },
    });
    if (!SuCo)
      BaoLoi(
        "Ca đang diễn ra chưa có sự cố vận hành đang mở; hãy báo sự cố cho tài nguyên bị ảnh hưởng.",
      );
    return TaoPhienSuCo(SuCo.Id, new Date(Date.now() + 60000), TaoLai, PhamVi);
  }
  return TaoPhienSuCo(Id, Ca.ThoiGianBatDau, TaoLai, PhamVi, true);
}
export async function DocPhienCaQuay(Id: string, PhamVi: PhamViSuCo) {
  await LayCaQuyetDinh(Id, PhamVi);
  const Phien = await CoSoDuLieu.phienQuyetDinh.findFirst({
    where: { CaQuayId: Id, DonViId: PhamVi.DonViId, TrangThai: "MO" },
  });
  return Phien ? TraPhien(Phien, CoSoDuLieu) : null;
}

function GioCanCoMat(NoiDung: Prisma.JsonValue, MacDinh: Date) {
  return NoiDung &&
    typeof NoiDung === "object" &&
    !Array.isArray(NoiDung) &&
    typeof NoiDung.BatDau === "string"
    ? new Date(NoiDung.BatDau)
    : MacDinh;
}
