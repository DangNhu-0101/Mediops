import { ThucHienGiaoDichLich } from "./GiaoDichLichService.js";
import { DocAnhSuCo, ThanhJson } from "./DuLieuNhungService.js";
import { randomUUID } from "node:crypto";
import {
  MucDoSuCo,
  NguonSuCo,
  Prisma,
  TrangThaiSuCo,
  TrangThaiThietBi,
} from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { SoAnhSuCoToiDa } from "../Middlewares/TaiAnhThietBiMiddleware.js";
import { LoiSuCoBaoTri } from "./LoiNghiepVuService.js";
import {
  CongCuLuuTruAnhCloudinary,
  type CongCuLuuTruAnh,
  TaiDanhSachAnhAnToan,
} from "./TaiAnhService.js";

export interface DuLieuTaoSuCo {
  ThietBiId: string;
  CaQuayId?: string;
  KhoId?: string;
  MucDo: MucDoSuCo;
  MoTaLoi: string;
  Nguon: Exclude<NguonSuCo, "NHAP_KHO">;
}

export interface BoLocSuCo {
  TrangThai?: TrangThaiSuCo;
  MucDo?: MucDoSuCo;
  ThietBiId?: string;
  KhoId?: string;
  TimKiem?: string;
}

const ChonNguoiDung = {
  Id: true,
  HoTen: true,
  ChucDanh: { select: { TenChucDanh: true } },
} satisfies Prisma.NguoiDungSelect;

const ChonSuCo = {
  Id: true,
  ThietBiId: true,
  CaQuayId: true,
  KhoId: true,
  Nguon: true,
  MucDo: true,
  MoTaLoi: true,
  TrangThai: true,
  NgayTao: true,
  NgayBatDauXuLy: true,
  NgayHoanTat: true,
  PhuongAnXuLy: true,
  TrangThaiThietBiSauXuLy: true,
  ThietBi: {
    select: {
      Id: true,
      MaQR: true,
      SoSeri: true,
      TenThietBi: true,
      TrangThai: true,
      HinhAnhUrl: true,
      Kho: { select: { Id: true, MaKho: true, TenKho: true } },
    },
  },
  CaQuay: {
    select: {
      Id: true,
      MaCaQuay: true,
      TieuDe: true,
      ThoiGianBatDau: true,
      ThoiGianKetThuc: true,
    },
  },
  Kho: { select: { Id: true, MaKho: true, TenKho: true, DiaChi: true } },
  NguoiBaoCao: { select: ChonNguoiDung },
  NguoiBatDauXuLy: { select: ChonNguoiDung },
  NguoiHoanTat: { select: ChonNguoiDung },
  DanhSachAnh: true,
  NhatKyXuLy: {
    select: {
      Id: true,
      GhiChu: true,
      TrangThaiThietBi: true,
      NgayTao: true,
      NguoiThucHien: { select: ChonNguoiDung },
    },
    orderBy: { NgayTao: "asc" },
  },
} satisfies Prisma.SuCoBaoTriSelect;

export function LayTrangThaiChanTheoMucDo(MucDo: MucDoSuCo) {
  return MucDo === MucDoSuCo.NHE
    ? TrangThaiThietBi.BAO_TRI
    : TrangThaiThietBi.HU_HONG;
}

export function LayTrangThaiMoiKhiBaoSuCo(
  TrangThaiHienTai: TrangThaiThietBi,
  MucDo: MucDoSuCo,
) {
  if (TrangThaiHienTai === TrangThaiThietBi.DANG_SU_DUNG) {
    return TrangThaiThietBi.DANG_SU_DUNG;
  }
  if (TrangThaiHienTai === TrangThaiThietBi.HU_HONG) {
    return TrangThaiThietBi.HU_HONG;
  }
  const TrangThaiChan = LayTrangThaiChanTheoMucDo(MucDo);
  if (
    TrangThaiHienTai === TrangThaiThietBi.BAO_TRI &&
    TrangThaiChan === TrangThaiThietBi.BAO_TRI
  ) {
    return TrangThaiThietBi.BAO_TRI;
  }
  return TrangThaiChan;
}

async function XacNhanNguCanhSuCo(DuLieu: DuLieuTaoSuCo, DonViId: string) {
  const [ThietBi, CaQuay, Kho] = await Promise.all([
    CoSoDuLieu.thietBi.findFirst({
      where: {
        Id: DuLieu.ThietBiId,
        DanhMuc: { DonViId: DonViId },
        ...(DuLieu.CaQuayId
          ? { LichSuCaQuay: { some: { CaQuayId: DuLieu.CaQuayId } } }
          : {}),
      },
      select: { Id: true, TrangThai: true },
    }),
    DuLieu.CaQuayId
      ? CoSoDuLieu.caQuay.findFirst({
          where: { Id: DuLieu.CaQuayId, DuAn: { DonViId: DonViId } },
          select: { Id: true },
        })
      : Promise.resolve(null),
    DuLieu.KhoId
      ? CoSoDuLieu.kho.findFirst({
          where: { Id: DuLieu.KhoId, DonViId: DonViId },
          select: { Id: true },
        })
      : Promise.resolve(null),
  ]);
  if (!ThietBi) {
    throw new LoiSuCoBaoTri(
      "Không tìm thấy thiết bị được phép báo sự cố.",
      404,
      "KHONG_TIM_THAY_THIET_BI",
    );
  }
  if (DuLieu.CaQuayId && !CaQuay) {
    throw new LoiSuCoBaoTri(
      "Ca quay không thuộc đơn vị hoặc thiết bị không được phân công cho ca này.",
      422,
      "CA_QUAY_KHONG_HOP_LE",
    );
  }
  if (DuLieu.KhoId && !Kho) {
    throw new LoiSuCoBaoTri(
      "Kho được chọn không thuộc đơn vị.",
      422,
      "KHO_KHONG_HOP_LE",
    );
  }
  return ThietBi;
}

export async function TaoSuCoBaoTri(ThamSo: {
  DuLieu: DuLieuTaoSuCo;
  NguoiBaoCaoId: string;
  DonViId: string;
  DanhSachTep?: Express.Multer.File[];
  CongCuAnh?: CongCuLuuTruAnh;
}) {
  const DanhSachTep = ThamSo.DanhSachTep ?? [];
  if (DanhSachTep.length > SoAnhSuCoToiDa) {
    throw new LoiSuCoBaoTri(
      `Mỗi sự cố chỉ được đính kèm tối đa ${SoAnhSuCoToiDa} ảnh.`,
      400,
      "QUA_NHIEU_ANH",
    );
  }
  const ThietBi = await XacNhanNguCanhSuCo(ThamSo.DuLieu, ThamSo.DonViId);
  const SuCoId = randomUUID();
  const LuuSuCo = (
    DanhSachAnh: Array<{ SecureUrl: string; PublicId: string }>,
  ) =>
    ThucHienGiaoDichLich(async (Db) => {
      const MayHienTai = await Db.thietBi.findUniqueOrThrow({
        where: { Id: ThietBi.Id },
      });
      await Db.suCoBaoTri.create({
        data: {
          Id: SuCoId,
          ...ThamSo.DuLieu,
          NguoiBaoCaoId: ThamSo.NguoiBaoCaoId,
          DanhSachAnh: DanhSachAnh.map((Anh) => ({
            Id: randomUUID(),
            SecureUrl: Anh.SecureUrl,
            PublicId: Anh.PublicId,
            NgayTao: new Date().toISOString(),
          })),
        },
      });
      await Db.thietBi.update({
        where: { Id: ThietBi.Id },
        data: {
          TrangThai: LayTrangThaiMoiKhiBaoSuCo(
            MayHienTai.TrangThai,
            ThamSo.DuLieu.MucDo,
          ),
        },
      });
      return Db.suCoBaoTri.findUniqueOrThrow({
        where: { Id: SuCoId },
        select: ChonSuCo,
      });
    }).then(TrinhBaySuCo);
  if (!DanhSachTep.length) return LuuSuCo([]);
  return TaiDanhSachAnhAnToan({
    DanhSachTep: DanhSachTep,
    ThuMuc: `mediops/su-co/${SuCoId}`,
    LuuVaoCoSoDuLieu: LuuSuCo,
    CongCu: ThamSo.CongCuAnh,
  });
}

export function LayDanhSachSuCoBaoTri(DonViId: string, BoLoc: BoLocSuCo) {
  const Where = {
    ThietBi: { DanhMuc: { DonViId: DonViId } },
    ...(BoLoc.TrangThai ? { TrangThai: BoLoc.TrangThai } : {}),
    ...(BoLoc.MucDo ? { MucDo: BoLoc.MucDo } : {}),
    ...(BoLoc.ThietBiId ? { ThietBiId: BoLoc.ThietBiId } : {}),
    ...(BoLoc.KhoId ? { KhoId: BoLoc.KhoId } : {}),
    ...(BoLoc.TimKiem
      ? {
          OR: [
            { MoTaLoi: { contains: BoLoc.TimKiem, mode: "insensitive" } },
            {
              ThietBi: {
                TenThietBi: {
                  contains: BoLoc.TimKiem,
                  mode: "insensitive",
                },
              },
            },
            {
              ThietBi: {
                MaQR: { contains: BoLoc.TimKiem, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  } satisfies Prisma.SuCoBaoTriWhereInput;
  return CoSoDuLieu.suCoBaoTri
    .findMany({
      where: Where,
      select: ChonSuCo,
      orderBy: [{ TrangThai: "asc" }, { NgayTao: "desc" }],
      take: 200,
    })
    .then((DanhSach) => DanhSach.map(TrinhBaySuCo));
}

export async function LayChiTietSuCoBaoTri(Id: string, DonViId: string) {
  const SuCo = await CoSoDuLieu.suCoBaoTri.findFirst({
    where: { Id: Id, ThietBi: { DanhMuc: { DonViId: DonViId } } },
    select: ChonSuCo,
  });
  if (!SuCo) {
    throw new LoiSuCoBaoTri(
      "Không tìm thấy sự cố.",
      404,
      "KHONG_TIM_THAY_SU_CO",
    );
  }
  return TrinhBaySuCo(SuCo);
}

export async function ThemAnhSuCo(ThamSo: {
  SuCoId: string;
  NguoiDungId: string;
  CoQuyenXuLy?: boolean;
  DonViId: string;
  DanhSachTep: Express.Multer.File[];
  BoAnhId?: string[];
  CongCuAnh?: CongCuLuuTruAnh;
}) {
  const BoAnhId = new Set(ThamSo.BoAnhId ?? []);
  if (!ThamSo.DanhSachTep.length && !BoAnhId.size) {
    throw new LoiSuCoBaoTri(
      "Vui lòng chọn ít nhất một ảnh hiện trường.",
      400,
      "CHUA_CHON_ANH",
    );
  }
  const SuCo = await CoSoDuLieu.suCoBaoTri.findFirst({
    where: {
      Id: ThamSo.SuCoId,
      ThietBi: { DanhMuc: { DonViId: ThamSo.DonViId } },
    },
    select: {
      Id: true,
      NguoiBaoCaoId: true,
      DanhSachAnh: true,
    },
  });
  if (!SuCo) {
    throw new LoiSuCoBaoTri(
      "Không tìm thấy sự cố.",
      404,
      "KHONG_TIM_THAY_SU_CO",
    );
  }
  const CoQuyenXuLy = ThamSo.CoQuyenXuLy === true;
  if (!CoQuyenXuLy && SuCo.NguoiBaoCaoId !== ThamSo.NguoiDungId) {
    throw new LoiSuCoBaoTri(
      "Bạn không có quyền bổ sung ảnh cho sự cố này.",
      403,
      "KHONG_CO_QUYEN",
    );
  }
  if (
    DocAnhSuCo(SuCo.DanhSachAnh).filter((Anh) => !BoAnhId.has(Anh.Id)).length +
      ThamSo.DanhSachTep.length >
    SoAnhSuCoToiDa
  ) {
    throw new LoiSuCoBaoTri(
      `Mỗi sự cố chỉ được lưu tối đa ${SoAnhSuCoToiDa} ảnh.`,
      400,
      "QUA_NHIEU_ANH",
    );
  }
  const AnhCanDon: string[] = [];
  const KetQua = await TaiDanhSachAnhAnToan({
    DanhSachTep: ThamSo.DanhSachTep,
    ThuMuc: `mediops/su-co/${SuCo.Id}`,
    CongCu: ThamSo.CongCuAnh,
    LuuVaoCoSoDuLieu: async (DanhSachAnh) => {
      try {
        return await CoSoDuLieu.$transaction(
          async (Db) => {
            const HienTai = await Db.suCoBaoTri.findFirstOrThrow({
              where: {
                Id: SuCo.Id,
                ThietBi: { DanhMuc: { DonViId: ThamSo.DonViId } },
              },
              select: { DanhSachAnh: true },
            });
            const AnhHienTai = DocAnhSuCo(HienTai.DanhSachAnh);
            if (
              [...BoAnhId].some(
                (Id) => !AnhHienTai.some((Anh) => Anh.Id === Id),
              )
            )
              throw new LoiSuCoBaoTri(
                "Ảnh đã thay đổi hoặc không thuộc sự cố này.",
                409,
                "XUNG_DOT_ANH",
              );
            const AnhGiuLai = AnhHienTai.filter((Anh) => !BoAnhId.has(Anh.Id));
            const SoAnhHienTai = AnhGiuLai.length;
            if (SoAnhHienTai + DanhSachAnh.length > SoAnhSuCoToiDa) {
              throw new LoiSuCoBaoTri(
                `Mỗi sự cố chỉ được lưu tối đa ${SoAnhSuCoToiDa} ảnh.`,
                409,
                "QUA_NHIEU_ANH",
              );
            }
            await Db.suCoBaoTri.update({
              where: { Id: SuCo.Id },
              data: {
                DanhSachAnh: ThanhJson([
                  ...AnhGiuLai,
                  ...DanhSachAnh.map((Anh) => ({
                    ...Anh,
                    Id: randomUUID(),
                    NgayTao: new Date().toISOString(),
                  })),
                ]),
              },
            });
            const ChiTiet = await Db.suCoBaoTri.findFirst({
              where: {
                Id: SuCo.Id,
                ThietBi: { DanhMuc: { DonViId: ThamSo.DonViId } },
              },
              select: ChonSuCo,
            });
            if (!ChiTiet) {
              throw new LoiSuCoBaoTri(
                "Không tìm thấy sự cố.",
                404,
                "KHONG_TIM_THAY_SU_CO",
              );
            }
            AnhCanDon.push(
              ...AnhHienTai.filter((Anh) => BoAnhId.has(Anh.Id)).flatMap(
                (Anh) => (Anh.PublicId ? [Anh.PublicId] : []),
              ),
            );
            return TrinhBaySuCo(ChiTiet);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (Loi) {
        if (
          Loi instanceof Prisma.PrismaClientKnownRequestError &&
          Loi.code === "P2034"
        ) {
          throw new LoiSuCoBaoTri(
            "Danh sách ảnh vừa thay đổi. Vui lòng thử lại.",
            409,
            "XUNG_DOT_ANH",
          );
        }
        throw Loi;
      }
    },
  });
  const CongCu = ThamSo.CongCuAnh ?? CongCuLuuTruAnhCloudinary;
  await Promise.allSettled(AnhCanDon.map((Id) => CongCu.XoaAnh(Id)));
  return KetQua;
}

export async function BatDauXuLySuCo(ThamSo: {
  SuCoId: string;
  NguoiXuLyId: string;
  DonViId: string;
}) {
  await ThucHienGiaoDichLich(async (Db) => {
    const SuCo = await Db.suCoBaoTri.findFirst({
      where: {
        Id: ThamSo.SuCoId,
        ThietBi: { DanhMuc: { DonViId: ThamSo.DonViId } },
      },
      select: {
        Id: true,
        MucDo: true,
        TrangThai: true,
        ThietBi: { select: { Id: true, TrangThai: true } },
      },
    });
    if (!SuCo) {
      throw new LoiSuCoBaoTri(
        "Không tìm thấy sự cố.",
        404,
        "KHONG_TIM_THAY_SU_CO",
      );
    }
    if (SuCo.TrangThai !== TrangThaiSuCo.CHO_XU_LY) {
      throw new LoiSuCoBaoTri(
        "Sự cố không còn ở trạng thái chờ xử lý.",
        409,
        "CHUYEN_TRANG_THAI_KHONG_HOP_LE",
      );
    }
    if (SuCo.ThietBi.TrangThai === TrangThaiThietBi.DANG_SU_DUNG) {
      throw new LoiSuCoBaoTri(
        "Thiết bị cần được nhập kho trước khi bắt đầu bảo trì.",
        409,
        "THIET_BI_CHUA_NHAP_KHO",
      );
    }
    const KetQua = await Db.suCoBaoTri.updateMany({
      where: { Id: SuCo.Id, TrangThai: TrangThaiSuCo.CHO_XU_LY },
      data: {
        TrangThai: TrangThaiSuCo.DANG_SUA_CHUA,
        NguoiBatDauXuLyId: ThamSo.NguoiXuLyId,
        NgayBatDauXuLy: new Date(),
      },
    });
    if (KetQua.count !== 1) {
      throw new LoiSuCoBaoTri(
        "Trạng thái sự cố vừa thay đổi. Hãy tải lại dữ liệu.",
        409,
        "XUNG_DOT_TRANG_THAI",
      );
    }
    if (SuCo.ThietBi.TrangThai === TrangThaiThietBi.SAN_SANG) {
      await Db.thietBi.update({
        where: { Id: SuCo.ThietBi.Id },
        data: { TrangThai: LayTrangThaiChanTheoMucDo(SuCo.MucDo) },
      });
    }
  });
  return LayChiTietSuCoBaoTri(ThamSo.SuCoId, ThamSo.DonViId);
}

export async function HoanTatXuLySuCo(ThamSo: {
  SuCoId: string;
  NguoiXuLyId: string;
  DonViId: string;
  GhiChuXuLy: string;
  TrangThaiThietBi: Extract<
    TrangThaiThietBi,
    "SAN_SANG" | "BAO_TRI" | "HU_HONG"
  >;
}) {
  await ThucHienGiaoDichLich(async (Db) => {
    const SuCo = await Db.suCoBaoTri.findFirst({
      where: {
        Id: ThamSo.SuCoId,
        ThietBi: { DanhMuc: { DonViId: ThamSo.DonViId } },
      },
      select: { Id: true, ThietBiId: true, TrangThai: true },
    });
    if (!SuCo) {
      throw new LoiSuCoBaoTri(
        "Không tìm thấy sự cố.",
        404,
        "KHONG_TIM_THAY_SU_CO",
      );
    }
    if (SuCo.TrangThai !== TrangThaiSuCo.DANG_SUA_CHUA) {
      throw new LoiSuCoBaoTri(
        "Chỉ có thể hoàn tất sự cố đang được xử lý.",
        409,
        "CHUYEN_TRANG_THAI_KHONG_HOP_LE",
      );
    }
    if (ThamSo.TrangThaiThietBi === TrangThaiThietBi.SAN_SANG) {
      const SuCoKhacDangMo = await Db.suCoBaoTri.count({
        where: {
          ThietBiId: SuCo.ThietBiId,
          Id: { not: SuCo.Id },
          TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC },
        },
      });
      if (SuCoKhacDangMo > 0) {
        throw new LoiSuCoBaoTri(
          "Thiết bị còn sự cố khác chưa khắc phục nên chưa thể trở lại sẵn sàng.",
          409,
          "CON_SU_CO_DANG_MO",
        );
      }
      await Db.suCoBaoTri.update({
        where: { Id: SuCo.Id },
        data: {
          TrangThai: TrangThaiSuCo.DA_KHAC_PHUC,
          PhuongAnXuLy: ThamSo.GhiChuXuLy,
          TrangThaiThietBiSauXuLy: TrangThaiThietBi.SAN_SANG,
          NguoiHoanTatId: ThamSo.NguoiXuLyId,
          NgayHoanTat: new Date(),
        },
      });
    } else {
      await Db.suCoBaoTri.update({
        where: { Id: SuCo.Id },
        data: {
          PhuongAnXuLy: ThamSo.GhiChuXuLy,
          TrangThaiThietBiSauXuLy: ThamSo.TrangThaiThietBi,
        },
      });
    }
    await Db.thietBi.update({
      where: { Id: SuCo.ThietBiId },
      data: { TrangThai: ThamSo.TrangThaiThietBi },
    });
    await Db.nhatKyXuLySuCo.create({
      data: {
        SuCoBaoTriId: SuCo.Id,
        NguoiThucHienId: ThamSo.NguoiXuLyId,
        GhiChu: ThamSo.GhiChuXuLy,
        TrangThaiThietBi: ThamSo.TrangThaiThietBi,
      },
    });
  });
  return LayChiTietSuCoBaoTri(ThamSo.SuCoId, ThamSo.DonViId);
}

function TrinhBaySuCo<T extends { DanhSachAnh: unknown }>(SuCo: T) {
  return {
    ...SuCo,
    DanhSachAnh: DocAnhSuCo(SuCo.DanhSachAnh).map(
      ({ Id, SecureUrl, NgayTao }) => ({ Id, SecureUrl, NgayTao }),
    ),
  };
}
