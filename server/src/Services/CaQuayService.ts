import { LayPhienGiuChoNoiBo } from "./NguCanhGiuChoService.js";
import { DocYeuCau, ThanhJson } from "./DuLieuNhungService.js";
import { BaoDamChucDanhPhanCong } from "./PhanCongChucVuService.js";
import {
  LoaiTaiNguyen,
  Prisma,
  TrangThaiMuonTra,
  type TrangThaiCaQuay,
} from "@prisma/client";
import { PhamViCaQuay } from "./QuyenService.js";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  LoiDuLieuKhongHopLe,
  LoiKhongTimThay,
  LoiXungDotDuLieu,
  LoiXungDotLichCaQuay,
} from "./LoiNghiepVuService.js";
import { ThucHienGiaoDichLich } from "./GiaoDichLichService.js";
import { KiemTraXungDotToanDien } from "./ThuatToanXungDotService.js";
import {
  DanhGiaYeuCauTaiNguyen,
  LayTaiNguyenDoiChieu,
  LayYeuCauCaQuay,
  KiemTraThamChieuYeuCau,
  LayNhanYeuCau,
} from "./YeuCauTaiNguyenService.js";

export interface DuLieuCaQuay {
  CacYeuCauTaiNguyen?: Prisma.InputJsonValue;
  MaCaQuay?: string;
  DuAnId: string;
  TieuDe: string;
  ThoiGianBatDau: Date;
  ThoiGianKetThuc: Date;
  PhongStudioId?: string | null;
  GhiChuDiaDiem?: string;
  NguoiPhuTrachId: string;
  TrangThai?: TrangThaiCaQuay;
  GhiChu?: string;
  MucDoUuTien?: number;
  CoTheDoiLich?: boolean;
  ThoiGianBatDauSomNhat?: Date | null;
  ThoiGianKetThucMuonNhat?: Date | null;
  ThoiGianChuanBiPhut?: number;
  ThoiGianThuHoiPhut?: number;
  DanhSachThietBiId?: string[];
  DanhSachNhanSu?: { NguoiDungId: string; ChucDanhPhanCong: string }[];
}

export async function LayDanhSachCaQuay(ThamSo: {
  DonViId: string;
  NguoiDungId?: string;
  TuNgay?: Date;
  DenNgay?: Date;
  PhongStudioId?: string;
  TrangThai?: TrangThaiCaQuay;
  DuAnId?: string;
}) {
  const Where = {
    DuAn: { DonViId: ThamSo.DonViId },
    ...(ThamSo.NguoiDungId ? PhamViCaQuay(ThamSo.NguoiDungId) : {}),
    ...(ThamSo.TuNgay ? { ThoiGianKetThuc: { gt: ThamSo.TuNgay } } : {}),
    ...(ThamSo.DenNgay ? { ThoiGianBatDau: { lt: ThamSo.DenNgay } } : {}),
    ...(ThamSo.PhongStudioId ? { PhongStudioId: ThamSo.PhongStudioId } : {}),
    ...(ThamSo.TrangThai ? { TrangThai: ThamSo.TrangThai } : {}),
    ...(ThamSo.DuAnId ? { DuAnId: ThamSo.DuAnId } : {}),
  } satisfies Prisma.CaQuayWhereInput;

  return CoSoDuLieu.caQuay.findMany({
    where: Where,
    select: {
      Id: true,
      MaCaQuay: true,
      TieuDe: true,
      ThoiGianBatDau: true,
      ThoiGianKetThuc: true,
      GhiChuDiaDiem: true,
      TrangThai: true,
      PhongStudio: { select: { Id: true, TenPhong: true, DiaDiem: true } },
      DuAn: { select: { Id: true, TenDuAn: true } },
      _count: { select: { DanhSachThietBi: true } },
    },
    orderBy: { ThoiGianBatDau: "asc" },
  });
}

export async function LayCaQuayCuaNguoiDungTheoNgay(ThamSo: {
  DonViId: string;
  NguoiDungId: string;
  TuNgay: Date;
  DenNgay: Date;
  ToanDonVi?: boolean;
}) {
  return CoSoDuLieu.caQuay.findMany({
    where: {
      DuAn: { DonViId: ThamSo.DonViId },
      ThoiGianKetThuc: { gt: ThamSo.TuNgay },
      ThoiGianBatDau: { lt: ThamSo.DenNgay },
      // Nhân viên kho vận hành toàn đơn vị thấy mọi ca trong ngày.
      ...(ThamSo.ToanDonVi
        ? {}
        : {
            OR: [
              { NguoiPhuTrachId: ThamSo.NguoiDungId },
              {
                DanhSachNhanSu: {
                  some: { NguoiDungId: ThamSo.NguoiDungId },
                },
              },
            ],
          }),
    },
    select: {
      Id: true,
      MaCaQuay: true,
      TieuDe: true,
      ThoiGianBatDau: true,
      ThoiGianKetThuc: true,
      GhiChuDiaDiem: true,
      TrangThai: true,
      PhongStudio: { select: { Id: true, TenPhong: true, DiaDiem: true } },
      DuAn: { select: { Id: true, TenDuAn: true } },
      DanhSachThietBi: {
        select: { TrangThaiMuonTra: true },
      },
    },
    orderBy: { ThoiGianBatDau: "asc" },
  });
}

export async function LayChiTietCaQuay(Id: string, DonViId: string) {
  const CaQuay = await CoSoDuLieu.caQuay.findFirst({
    where: { Id: Id, DuAn: { DonViId: DonViId } },
    include: {
      DuAn: true,
      PhongStudio: true,
      NguoiPhuTrach: {
        select: {
          Id: true,
          HoTen: true,
          ChucDanh: { select: { TenChucDanh: true } },
        },
      },
      DanhSachThietBi: {
        include: { ThietBi: { include: { DanhMuc: true, Kho: true } } },
      },
      DanhSachNhanSu: {
        include: {
          NguoiDung: {
            select: {
              Id: true,
              HoTen: true,
              ChucDanh: { select: { TenChucDanh: true } },
            },
          },
        },
      },
    },
  });
  if (!CaQuay) throw new LoiKhongTimThay("Không tìm thấy ca quay");
  return {
    ...CaQuay,
    CacYeuCauHienThi: await LayNhanYeuCau(
      DocYeuCau(CaQuay.CacYeuCauTaiNguyen),
      DonViId,
    ),
  };
}

export async function TaoCaQuay(DuLieu: DuLieuCaQuay, DonViId: string) {
  const {
    DanhSachThietBiId: DanhSachThietBiId = [],
    DanhSachNhanSu: DanhSachNhanSu = [],
    ...ThongTin
  } = DuLieu;
  try {
    return await ThucHienGiaoDichLich(async (Db) => {
      if (ThongTin.CacYeuCauTaiNguyen !== undefined) {
        const YeuCau = DocYeuCau(ThongTin.CacYeuCauTaiNguyen);
        await KiemTraThamChieuYeuCau(YeuCau, DonViId, Db);
        ThongTin.CacYeuCauTaiNguyen = ThanhJson(YeuCau);
      }
      await BaoDamTaiNguyenThuocDonVi(
        {
          DuAnId: ThongTin.DuAnId,
          PhongStudioId: ThongTin.PhongStudioId,
          NguoiPhuTrachId: ThongTin.NguoiPhuTrachId,
          DanhSachThietBiId: DanhSachThietBiId,
          DanhSachNhanSuId: DanhSachNhanSu.map(
            (PhanCong) => PhanCong.NguoiDungId,
          ),
        },
        DonViId,
        Db,
      );
      await BaoDamChucDanhPhanCong(
        Db,
        DonViId,
        ThongTin.NguoiPhuTrachId,
        DanhSachNhanSu,
      );
      await BaoDamLichKhongXungDot(
        {
          DonViId: DonViId,
          ThoiGianBatDau: ThongTin.ThoiGianBatDau,
          ThoiGianKetThuc: ThongTin.ThoiGianKetThuc,
          PhongStudioId: ThongTin.PhongStudioId,
          NguoiPhuTrachId: ThongTin.NguoiPhuTrachId,
          DanhSachThietBiId: DanhSachThietBiId,
          DanhSachNhanSuId: DanhSachNhanSu.map(
            (PhanCong) => PhanCong.NguoiDungId,
          ),
          ThoiGianChuanBiPhut: ThongTin.ThoiGianChuanBiPhut,
          ThoiGianThuHoiPhut: ThongTin.ThoiGianThuHoiPhut,
        },
        Db,
      );
      if (
        ThongTin.TrangThai &&
        ThongTin.TrangThai !== "DU_THAO" &&
        ThongTin.TrangThai !== "DA_HUY"
      ) {
        const TaiNguyen = await LayTaiNguyenDoiChieu(
          {
            DonViId,
            DanhSachThietBiId,
            DanhSachNhanSuId: [
              ThongTin.NguoiPhuTrachId,
              ...DanhSachNhanSu.map((Muc) => Muc.NguoiDungId),
            ],
            PhongStudioId: ThongTin.PhongStudioId,
          },
          Db,
        );
        const DanhGia = DanhGiaYeuCauTaiNguyen(
          DocYeuCau(ThongTin.CacYeuCauTaiNguyen ?? []),
          TaiNguyen,
        );
        if (!DanhGia.DapUngBatBuoc)
          throw new LoiXungDotDuLieu(DanhGia.DienGiai.join(" "));
      }
      return Db.caQuay.create({
        data: {
          ...ThongTin,
          DanhSachThietBi: {
            create: DanhSachThietBiId.map((ThietBiId) => ({
              ThietBiId: ThietBiId,
            })),
          },
          DanhSachNhanSu: { create: DanhSachNhanSu },
        },
        include: {
          DanhSachThietBi: {
            include: { ThietBi: { include: { DanhMuc: true } } },
          },
          DanhSachNhanSu: true,
        },
      });
    });
  } catch (Loi) {
    throw ChuyenLoiPrisma(Loi);
  }
}

export async function CapNhatCaQuay(
  Id: string,
  DuLieu: Partial<DuLieuCaQuay>,
  DonViId: string,
) {
  try {
    return await ThucHienGiaoDichLich((Db) =>
      CapNhatCaQuayTrongGiaoDich(Db, Id, DuLieu, DonViId),
    );
  } catch (Loi) {
    throw ChuyenLoiPrisma(Loi);
  }
}

// Dùng lại transaction có thẩm quyền của luồng áp dụng phương án.
export async function CapNhatCaQuayTrongGiaoDich(
  Db: Prisma.TransactionClient,
  Id: string,
  DuLieu: Partial<DuLieuCaQuay>,
  DonViId: string,
) {
  const CaQuayHienTai = await LayLichCaQuayHienTai(Id, DonViId, Db);
  // Biểu mẫu luôn gửi đủ trường, nên chỉ chặn khi tài nguyên hoặc giờ bắt đầu thật sự đổi.
  const CungTap = (A: string[], B: string[]) =>
    A.length === B.length && A.every((Muc) => B.includes(Muc));
  const DoiTaiNguyenKhiDangQuay =
    (DuLieu.DanhSachThietBiId !== undefined &&
      !CungTap(
        DuLieu.DanhSachThietBiId,
        CaQuayHienTai.DanhSachThietBi.map((Muc) => Muc.ThietBiId),
      )) ||
    (DuLieu.DanhSachNhanSu !== undefined &&
      !CungTap(
        DuLieu.DanhSachNhanSu.map((Muc) => Muc.NguoiDungId),
        CaQuayHienTai.DanhSachNhanSu.map((Muc) => Muc.NguoiDungId),
      )) ||
    (DuLieu.NguoiPhuTrachId !== undefined &&
      DuLieu.NguoiPhuTrachId !== CaQuayHienTai.NguoiPhuTrachId) ||
    (DuLieu.PhongStudioId !== undefined &&
      DuLieu.PhongStudioId !== CaQuayHienTai.PhongStudioId) ||
    (DuLieu.ThoiGianBatDau !== undefined &&
      new Date(DuLieu.ThoiGianBatDau).getTime() !==
        CaQuayHienTai.ThoiGianBatDau.getTime());
  if (CaQuayHienTai.TrangThai === "DANG_DIEN_RA" && DoiTaiNguyenKhiDangQuay) {
    throw new LoiDuLieuKhongHopLe(
      "Ca đang quay cần xử lý thay tài nguyên qua sự cố vận hành; nhân sự cần nhận lời mời rồi người điều phối chốt.",
    );
  }
  if (
    DuLieu.DanhSachNhanSu &&
    CaQuayHienTai.DanhSachNhanSu.some((Muc) => Muc.HieuLucTu || Muc.HieuLucDen)
  )
    throw new LoiDuLieuKhongHopLe(
      "Không thể ghi lại danh sách nhân sự đã có lịch sử bàn giao giữa ca.",
    );
  const {
    DanhSachThietBiId: DanhSachThietBiId,
    DanhSachNhanSu: DanhSachNhanSu,
    ...ThongTin
  } = DuLieu;
  const DanhSachThietBiSauCapNhat =
    DanhSachThietBiId ??
    CaQuayHienTai.DanhSachThietBi.map((PhanCong) => PhanCong.ThietBiId);
  const DanhSachNhanSuSauCapNhat =
    DanhSachNhanSu?.map((PhanCong) => PhanCong.NguoiDungId) ??
    CaQuayHienTai.DanhSachNhanSu.map((PhanCong) => PhanCong.NguoiDungId);
  const ThoiGianBatDauSauCapNhat =
    ThongTin.ThoiGianBatDau ?? CaQuayHienTai.ThoiGianBatDau;
  const ThoiGianKetThucSauCapNhat =
    ThongTin.ThoiGianKetThuc ?? CaQuayHienTai.ThoiGianKetThuc;
  if (ThoiGianKetThucSauCapNhat <= ThoiGianBatDauSauCapNhat) {
    throw new LoiDuLieuKhongHopLe(
      "Thời gian kết thúc phải sau thời gian bắt đầu",
    );
  }
  await BaoDamTaiNguyenThuocDonVi(
    {
      DuAnId: ThongTin.DuAnId ?? CaQuayHienTai.DuAnId,
      PhongStudioId:
        ThongTin.PhongStudioId !== undefined
          ? ThongTin.PhongStudioId
          : CaQuayHienTai.PhongStudioId,
      NguoiPhuTrachId:
        ThongTin.NguoiPhuTrachId ?? CaQuayHienTai.NguoiPhuTrachId,
      DanhSachThietBiId: DanhSachThietBiSauCapNhat,
      DanhSachNhanSuId: DanhSachNhanSuSauCapNhat,
    },
    DonViId,
    Db,
  );
  if (DanhSachNhanSu !== undefined || ThongTin.NguoiPhuTrachId !== undefined)
    await BaoDamChucDanhPhanCong(
      Db,
      DonViId,
      ThongTin.NguoiPhuTrachId ?? CaQuayHienTai.NguoiPhuTrachId,
      DanhSachNhanSu ?? CaQuayHienTai.DanhSachNhanSu,
      Id,
    );
  const NhanSuMoi = DuLieu.DanhSachNhanSu;
  const CoThayNhanSu =
    NhanSuMoi &&
    CaQuayHienTai.DanhSachNhanSu.some(
      (Cu) => !NhanSuMoi.some((Moi) => Moi.NguoiDungId === Cu.NguoiDungId),
    ) &&
    NhanSuMoi.some(
      (Moi) =>
        !CaQuayHienTai.DanhSachNhanSu.some(
          (Cu) => Cu.NguoiDungId === Moi.NguoiDungId,
        ),
    );
  const CoThayNguoiPhuTrach =
    DuLieu.NguoiPhuTrachId &&
    DuLieu.NguoiPhuTrachId !== CaQuayHienTai.NguoiPhuTrachId;
  if (!LayPhienGiuChoNoiBo() && (CoThayNguoiPhuTrach || CoThayNhanSu))
    throw new LoiDuLieuKhongHopLe(
      "Thay người cần gửi lời mời, nhận đồng ý rồi chốt qua phiên quyết định.",
    );
  await BaoDamLichKhongXungDot(
    {
      DonViId: DonViId,
      ThoiGianBatDau: ThoiGianBatDauSauCapNhat,
      ThoiGianKetThuc: ThoiGianKetThucSauCapNhat,
      PhongStudioId:
        ThongTin.PhongStudioId !== undefined
          ? ThongTin.PhongStudioId
          : CaQuayHienTai.PhongStudioId,
      NguoiPhuTrachId:
        ThongTin.NguoiPhuTrachId ?? CaQuayHienTai.NguoiPhuTrachId,
      DanhSachThietBiId: DanhSachThietBiSauCapNhat,
      DanhSachNhanSuId: DanhSachNhanSuSauCapNhat,
      CaQuayHienTaiId: Id,
      ThoiGianChuanBiPhut:
        ThongTin.ThoiGianChuanBiPhut ?? CaQuayHienTai.ThoiGianChuanBiPhut,
      ThoiGianThuHoiPhut:
        ThongTin.ThoiGianThuHoiPhut ?? CaQuayHienTai.ThoiGianThuHoiPhut,
    },
    Db,
  );
  const LoaiThayDoi = new Set<LoaiTaiNguyen>();
  if (DanhSachThietBiId !== undefined) LoaiThayDoi.add(LoaiTaiNguyen.THIET_BI);
  if (DanhSachNhanSu !== undefined || ThongTin.NguoiPhuTrachId !== undefined)
    LoaiThayDoi.add(LoaiTaiNguyen.NHAN_SU);
  if (ThongTin.PhongStudioId !== undefined)
    LoaiThayDoi.add(LoaiTaiNguyen.STUDIO);
  if (ThongTin.CacYeuCauTaiNguyen !== undefined) {
    await KiemTraThamChieuYeuCau(
      DocYeuCau(ThongTin.CacYeuCauTaiNguyen),
      DonViId,
      Db,
    );
  }
  if (
    ThongTin.CacYeuCauTaiNguyen !== undefined ||
    (ThongTin.TrangThai &&
      ThongTin.TrangThai !== "DU_THAO" &&
      ThongTin.TrangThai !== "DA_HUY")
  )
    Object.values(LoaiTaiNguyen).forEach((Loai) => LoaiThayDoi.add(Loai));
  if (LoaiThayDoi.size) {
    const YeuCau = (
      ThongTin.CacYeuCauTaiNguyen !== undefined
        ? DocYeuCau(ThongTin.CacYeuCauTaiNguyen)
        : await LayYeuCauCaQuay(Id, DonViId, Db)
    ).filter((Muc) => LoaiThayDoi.has(Muc.LoaiTaiNguyen));
    if (YeuCau.length) {
      const TaiNguyen = await LayTaiNguyenDoiChieu(
        {
          DonViId: DonViId,
          DanhSachThietBiId: DanhSachThietBiSauCapNhat,
          DanhSachNhanSuId: [
            ThongTin.NguoiPhuTrachId ?? CaQuayHienTai.NguoiPhuTrachId,
            ...DanhSachNhanSuSauCapNhat,
          ],
          PhongStudioId:
            ThongTin.PhongStudioId !== undefined
              ? ThongTin.PhongStudioId
              : CaQuayHienTai.PhongStudioId,
        },
        Db,
      );
      const DanhGia = DanhGiaYeuCauTaiNguyen(YeuCau, TaiNguyen);
      if (
        !DanhGia.DapUngBatBuoc &&
        !(
          (ThongTin.TrangThai ?? CaQuayHienTai.TrangThai) === "DU_THAO" &&
          ThongTin.CacYeuCauTaiNguyen !== undefined
        )
      )
        throw new LoiXungDotDuLieu(DanhGia.DienGiai.join(" "));
    }
  }
  if (ThongTin.TrangThai === "DA_HUY" || ThongTin.TrangThai === "HOAN_THANH") {
    const Phien = await Db.phienQuyetDinh.findMany({
      where: { CaQuayId: Id, DonViId, TrangThai: "MO" },
    });
    for (const Muc of Phien) {
      await Db.giuChoTaiNguyen.updateMany({
        where: { PhienId: Muc.Id, TrangThai: "MO" },
        data: { TrangThai: "DA_HUY" },
      });
      const LoiMoi = await Db.loiMoiThayCa.findMany({
        where: {
          PhienId: Muc.Id,
          TrangThai: { in: ["CHO_PHAN_HOI", "DA_DONG_Y"] },
        },
      });
      for (const Moi of LoiMoi)
        await Db.loiMoiThayCa.update({
          where: { Id: Moi.Id },
          data: {
            TrangThai: "DA_HUY",
            LichSu: {
              create: { NguoiThucHienId: Muc.NguoiTaoId, TrangThai: "DA_HUY" },
            },
          },
        });
      await Db.phienQuyetDinh.update({
        where: { Id: Muc.Id },
        data: { TrangThai: "DA_HUY" },
      });
    }
  }
  if (!DanhSachThietBiId) {
    return await Db.caQuay.update({
      where: { Id: Id },
      data: {
        ...ThongTin,
        ...(DanhSachNhanSu
          ? { DanhSachNhanSu: { deleteMany: {}, create: DanhSachNhanSu } }
          : {}),
      },
    });
  }
  const PhanCongHienTai = await Db.caQuayThietBi.findMany({
    where: { CaQuayId: Id },
    select: {
      ThietBiId: true,
      TrangThaiMuonTra: true,
      HieuLucTu: true,
      HieuLucDen: true,
    },
  });
  const IdMoi = new Set(DanhSachThietBiId);
  const IdHienTai = new Set(
    PhanCongHienTai.map((PhanCong) => PhanCong.ThietBiId),
  );
  if (
    PhanCongHienTai.some(
      (PhanCong) =>
        !IdMoi.has(PhanCong.ThietBiId) &&
        (PhanCong.TrangThaiMuonTra === TrangThaiMuonTra.DA_XUAT_KHO ||
          PhanCong.HieuLucTu !== null ||
          PhanCong.HieuLucDen !== null),
    )
  ) {
    throw new LoiXungDotDuLieu(
      "Không thể bỏ thiết bị đã xuất kho hoặc có lịch sử thay thế giữa ca.",
    );
  }
  return Db.caQuay.update({
    where: { Id: Id },
    data: {
      ...ThongTin,
      DanhSachThietBi: {
        deleteMany: { ThietBiId: { notIn: DanhSachThietBiId } },
        create: DanhSachThietBiId.filter(
          (ThietBiId) => !IdHienTai.has(ThietBiId),
        ).map((ThietBiId) => ({ ThietBiId: ThietBiId })),
      },
      ...(DanhSachNhanSu
        ? { DanhSachNhanSu: { deleteMany: {}, create: DanhSachNhanSu } }
        : {}),
    },
  });
}

export async function XoaCaQuay(Id: string, DonViId: string) {
  await KiemTraCaQuayTonTai(Id, DonViId);
  // Khóa ngoại RESTRICT của PostgreSQL không được Prisma đổi thành P2003,
  // nên kiểm tra dữ liệu vận hành trước để trả lỗi xung đột rõ ràng.
  const CaQuayCoDuLieuVanHanh = await CoSoDuLieu.caQuay.findFirst({
    where: {
      Id: Id,
      OR: [
        { NhatKyMuonTra: { some: {} } },
        { GiaoDichKho: { some: {} } },
        { SuCoVanHanh: { some: {} } },
      ],
    },
    select: { Id: true },
  });
  if (CaQuayCoDuLieuVanHanh) {
    throw new LoiXungDotDuLieu(
      "Không thể xóa ca quay đang có dữ liệu vận hành liên quan",
    );
  }
  try {
    await CoSoDuLieu.caQuay.delete({ where: { Id: Id } });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2003"
    ) {
      throw new LoiXungDotDuLieu(
        "Không thể xóa ca quay đang có dữ liệu vận hành liên quan",
      );
    }
    throw Loi;
  }
}

async function KiemTraCaQuayTonTai(Id: string, DonViId: string) {
  const CaQuay = await CoSoDuLieu.caQuay.findFirst({
    where: { Id: Id, DuAn: { DonViId: DonViId } },
    select: { Id: true },
  });
  if (!CaQuay) throw new LoiKhongTimThay("Không tìm thấy ca quay");
}

async function LayLichCaQuayHienTai(
  Id: string,
  DonViId: string,
  Db: Prisma.TransactionClient,
) {
  const CaQuay = await Db.caQuay.findFirst({
    where: { Id: Id, DuAn: { DonViId: DonViId } },
    select: {
      TrangThai: true,
      DuAnId: true,
      NguoiPhuTrachId: true,
      ThoiGianBatDau: true,
      ThoiGianKetThuc: true,
      PhongStudioId: true,
      ThoiGianChuanBiPhut: true,
      ThoiGianThuHoiPhut: true,
      DanhSachThietBi: { select: { ThietBiId: true } },
      DanhSachNhanSu: {
        select: {
          NguoiDungId: true,
          ChucDanhPhanCong: true,
          HieuLucTu: true,
          HieuLucDen: true,
        },
      },
    },
  });
  if (!CaQuay) throw new LoiKhongTimThay("Không tìm thấy ca quay");
  return CaQuay;
}

async function BaoDamLichKhongXungDot(
  ThamSo: {
    DonViId: string;
    ThoiGianBatDau: Date;
    ThoiGianKetThuc: Date;
    PhongStudioId?: string | null;
    NguoiPhuTrachId: string;
    DanhSachThietBiId: string[];
    DanhSachNhanSuId: string[];
    CaQuayHienTaiId?: string;
    ThoiGianChuanBiPhut?: number;
    ThoiGianThuHoiPhut?: number;
  },
  Db: Prisma.TransactionClient,
) {
  const KetQua = await KiemTraXungDotToanDien(ThamSo, Db);
  if (KetQua.CoXungDot) {
    throw new LoiXungDotLichCaQuay(
      "Phát hiện xung đột lịch. Vui lòng điều chỉnh thời gian hoặc tài nguyên.",
      KetQua.DanhSachXungDot,
    );
  }
}

async function BaoDamTaiNguyenThuocDonVi(
  ThamSo: {
    DuAnId: string;
    PhongStudioId?: string | null;
    NguoiPhuTrachId: string;
    DanhSachThietBiId: string[];
    DanhSachNhanSuId: string[];
  },
  DonViId: string,
  Db: Prisma.TransactionClient,
) {
  const DanhSachThietBiId = [...new Set(ThamSo.DanhSachThietBiId)];
  const DanhSachNguoiDungId = [
    ...new Set([ThamSo.NguoiPhuTrachId, ...ThamSo.DanhSachNhanSuId]),
  ];
  const [DuAn, Studio, SoThietBi, SoNguoiDung] = await Promise.all([
    Db.duAn.findFirst({
      where: { Id: ThamSo.DuAnId, DonViId: DonViId },
      select: { Id: true },
    }),
    ThamSo.PhongStudioId
      ? Db.phongStudio.findFirst({
          where: { Id: ThamSo.PhongStudioId, DonViId: DonViId },
          select: { Id: true },
        })
      : Promise.resolve({ Id: "khong-co-studio" }),
    Db.thietBi.count({
      where: {
        Id: { in: DanhSachThietBiId },
        DanhMuc: { DonViId: DonViId },
      },
    }),
    Db.nguoiDung.count({
      where: { Id: { in: DanhSachNguoiDungId }, DonViId: DonViId },
    }),
  ]);
  if (
    !DuAn ||
    !Studio ||
    SoThietBi !== DanhSachThietBiId.length ||
    SoNguoiDung !== DanhSachNguoiDungId.length
  ) {
    throw new LoiKhongTimThay(
      "Dự án, Studio, thiết bị hoặc nhân sự không thuộc đơn vị",
    );
  }
}

function ChuyenLoiPrisma(Loi: unknown) {
  if (Loi instanceof Prisma.PrismaClientKnownRequestError) {
    if (Loi.code === "P2002") {
      return new LoiXungDotDuLieu("Mã ca quay đã được sử dụng");
    }
    if (Loi.code === "P2003") {
      return new LoiXungDotDuLieu(
        "Dự án, Studio hoặc người phụ trách ca không hợp lệ",
      );
    }
  }
  return Loi;
}
