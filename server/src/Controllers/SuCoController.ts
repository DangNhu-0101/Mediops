import { LoiXungDotDuLieu } from "../Services/LoiNghiepVuService.js";
import {
  LoaiHanhDong,
  MucDoSuCo,
  Prisma,
  TrangThaiSuCo,
  TrangThaiThietBi,
} from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import { CoSoDuLieu } from "../Config/Database.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import { LoiSuCoBaoTri } from "../Services/LoiNghiepVuService.js";
import { PhatCapNhatLich } from "../Services/SocketService.js";
import {
  BatDauXuLySuCo,
  HoanTatXuLySuCo,
  LayChiTietSuCoBaoTri,
  LayDanhSachSuCoBaoTri,
  TaoSuCoBaoTri,
  ThemAnhSuCo,
} from "../Services/SuCoBaoTriService.js";
import type { YeuCauXacThuc } from "../Types/index.js";

const IdTuyChon = z.preprocess(
  (GiaTri) => (GiaTri === "" ? undefined : GiaTri),
  z.string().uuid("Mã tham chiếu không hợp lệ").optional(),
);

const DuLieuTaoSuCoSchema = z
  .object({
    ThietBiId: z.string().uuid("Thiết bị không hợp lệ"),
    CaQuayId: IdTuyChon,
    KhoId: IdTuyChon,
    MucDo: z.nativeEnum(MucDoSuCo, {
      errorMap: () => ({ message: "Mức độ sự cố không hợp lệ" }),
    }),
    Nguon: z
      .enum(["TRONG_QUA_TRINH_SU_DUNG", "KIEM_TRA_KHO"], {
        errorMap: () => ({ message: "Nguồn ghi nhận sự cố không hợp lệ" }),
      })
      .default("KIEM_TRA_KHO"),
    MoTaLoi: z
      .string()
      .trim()
      .min(5, "Mô tả tình trạng phải có ít nhất 5 ký tự")
      .max(2000, "Mô tả tình trạng không được vượt quá 2.000 ký tự"),
  })
  .strict();

const BoLocSuCoSchema = z.object({
  TrangThai: z.nativeEnum(TrangThaiSuCo).optional(),
  MucDo: z.nativeEnum(MucDoSuCo).optional(),
  ThietBiId: z.string().uuid().optional(),
  KhoId: z.string().uuid().optional(),
  TimKiem: z.string().trim().max(200).optional(),
});

const HoanTatSchema = z
  .object({
    GhiChuXuLy: z
      .string()
      .trim()
      .min(2, "Vui lòng ghi rõ nội dung đã kiểm tra hoặc sửa chữa")
      .max(2000, "Nội dung xử lý không được vượt quá 2.000 ký tự"),
    TrangThaiThietBi: z.enum([
      TrangThaiThietBi.SAN_SANG,
      TrangThaiThietBi.BAO_TRI,
      TrangThaiThietBi.HU_HONG,
    ]),
  })
  .strict();

function XuLyLoi(
  PhanHoi: Response,
  TiepTheo: NextFunction | undefined,
  Loi: unknown,
) {
  if (Loi instanceof z.ZodError) {
    return PhanHoi.status(400).json({
      ThongBao: Loi.issues[0]?.message ?? "Dữ liệu sự cố không hợp lệ",
    });
  }
  if (Loi instanceof LoiXungDotDuLieu)
    return PhanHoi.status(409).json({ ThongBao: Loi.message });
  if (Loi instanceof LoiSuCoBaoTri) {
    return PhanHoi.status(Loi.MaTrangThai).json({
      ThongBao: Loi.message,
      MaLoi: Loi.MaLoi,
    });
  }
  return TiepTheo ? TiepTheo(Loi) : Promise.reject(Loi);
}

function LayDanhSachTep(YeuCau: YeuCauXacThuc) {
  return Array.isArray(YeuCau.files) ? YeuCau.files : [];
}

export async function TaoSuCo(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const DuLieu = DuLieuTaoSuCoSchema.parse(YeuCau.body);
    const SuCo = await TaoSuCoBaoTri({
      DuLieu: DuLieu,
      NguoiBaoCaoId: YeuCau.NguoiDung!.nguoiDungId,
      DonViId: LayDonViId(YeuCau),
      DanhSachTep: LayDanhSachTep(YeuCau),
    });
    await PhatCapNhatLich(
      "bao_tri:cap_nhat",
      { SuCoId: SuCo.Id, ThietBiId: SuCo.ThietBiId, CaQuayId: SuCo.CaQuayId },
      SuCo.CaQuayId ?? undefined,
      LayDonViId(YeuCau),
    );
    return PhanHoi.status(201).json(SuCo);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayDanhSachSuCo(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const BoLoc = BoLocSuCoSchema.parse(YeuCau.query);
    return PhanHoi.json(await LayDanhSachSuCoBaoTri(LayDonViId(YeuCau), BoLoc));
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayChiTietSuCo(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayChiTietSuCoBaoTri(String(YeuCau.params.id), LayDonViId(YeuCau)),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function BoSungAnhSuCo(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const BoAnhId = z
      .array(z.string().uuid("Ảnh không hợp lệ"))
      .max(5)
      .parse(
        typeof YeuCau.body.BoAnhId === "string"
          ? (() => {
              try {
                return JSON.parse(YeuCau.body.BoAnhId);
              } catch {
                return null;
              }
            })()
          : (YeuCau.body.BoAnhId ?? []),
      );
    const SuCo = await ThemAnhSuCo({
      BoAnhId,
      SuCoId: String(YeuCau.params.id),
      NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
      CoQuyenXuLy: YeuCau.NguoiDung!.Quyen?.includes("SuCo.Sua"),
      DonViId: LayDonViId(YeuCau),
      DanhSachTep: LayDanhSachTep(YeuCau),
    });
    await PhatCapNhatLich(
      "bao_tri:cap_nhat",
      { SuCoId: SuCo.Id, ThietBiId: SuCo.ThietBiId, CaQuayId: SuCo.CaQuayId },
      SuCo.CaQuayId ?? undefined,
      LayDonViId(YeuCau),
    );
    return PhanHoi.json(SuCo);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function BatDauXuLy(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const SuCo = await BatDauXuLySuCo({
      SuCoId: String(YeuCau.params.id),
      NguoiXuLyId: YeuCau.NguoiDung!.nguoiDungId,
      DonViId: LayDonViId(YeuCau),
    });
    await PhatCapNhatLich(
      "bao_tri:cap_nhat",
      { SuCoId: SuCo.Id, ThietBiId: SuCo.ThietBiId, CaQuayId: SuCo.CaQuayId },
      SuCo.CaQuayId ?? undefined,
      LayDonViId(YeuCau),
    );
    return PhanHoi.json(SuCo);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function HoanTatSuCo(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const DuLieu = HoanTatSchema.parse(YeuCau.body);
    const SuCo = await HoanTatXuLySuCo({
      SuCoId: String(YeuCau.params.id),
      NguoiXuLyId: YeuCau.NguoiDung!.nguoiDungId,
      DonViId: LayDonViId(YeuCau),
      ...DuLieu,
    });
    await PhatCapNhatLich(
      "bao_tri:cap_nhat",
      { SuCoId: SuCo.Id, ThietBiId: SuCo.ThietBiId, CaQuayId: SuCo.CaQuayId },
      SuCo.CaQuayId ?? undefined,
      LayDonViId(YeuCau),
    );
    return PhanHoi.json(SuCo);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayNhatKyMuonTra(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const BoLoc = z
      .object({
        Trang: z.coerce.number().int().min(1).default(1),
        KichThuocTrang: z.coerce.number().int().min(1).max(100).default(25),
        TuNgay: z.string().datetime({ offset: true }).optional(),
        DenNgay: z.string().datetime({ offset: true }).optional(),
        LoaiHanhDong: z.nativeEnum(LoaiHanhDong).optional(),
        KhoId: z.string().uuid().optional(),
        ThietBiId: z.string().uuid().optional(),
        CaQuayId: z.string().uuid().optional(),
        NguoiThucHienId: z.string().uuid().optional(),
      })
      .strict()
      .parse(YeuCau.query);
    if (BoLoc.TuNgay && BoLoc.DenNgay && BoLoc.TuNgay > BoLoc.DenNgay) {
      return PhanHoi.status(400).json({
        ThongBao: "Khoảng thời gian không hợp lệ.",
      });
    }
    const Where: Prisma.NhatKyMuonTraWhereInput = {
      CaQuay: { DuAn: { DonViId: LayDonViId(YeuCau) } },
      ThietBi: { DanhMuc: { DonViId: LayDonViId(YeuCau) } },
      ...(BoLoc.LoaiHanhDong ? { LoaiHanhDong: BoLoc.LoaiHanhDong } : {}),
      ...(BoLoc.KhoId ? { GiaoDichKho: { KhoId: BoLoc.KhoId } } : {}),
      ...(BoLoc.ThietBiId ? { ThietBiId: BoLoc.ThietBiId } : {}),
      ...(BoLoc.CaQuayId ? { CaQuayId: BoLoc.CaQuayId } : {}),
      ...(BoLoc.NguoiThucHienId
        ? { NguoiThucHienId: BoLoc.NguoiThucHienId }
        : {}),
      ...(BoLoc.TuNgay || BoLoc.DenNgay
        ? {
            ThoiGian: {
              ...(BoLoc.TuNgay ? { gte: new Date(BoLoc.TuNgay) } : {}),
              ...(BoLoc.DenNgay ? { lte: new Date(BoLoc.DenNgay) } : {}),
            },
          }
        : {}),
    };
    const [TongSo, DanhSach] = await CoSoDuLieu.$transaction([
      CoSoDuLieu.nhatKyMuonTra.count({ where: Where }),
      CoSoDuLieu.nhatKyMuonTra.findMany({
        where: Where,
        select: {
          Id: true,
          ThoiGian: true,
          LoaiHanhDong: true,
          PhuongThuc: true,
          TinhTrangTra: true,
          GhiChuTinhTrang: true,
          ThietBi: { select: { Id: true, MaQR: true, TenThietBi: true } },
          CaQuay: { select: { Id: true, MaCaQuay: true, TieuDe: true } },
          NguoiThucHien: { select: { Id: true, HoTen: true } },
          KhoNguon: { select: { Id: true, TenKho: true } },
          GiaoDichKho: {
            select: {
              Id: true,
              KhoangCachDenKhoMet: true,
              ViTriDat: true,
              Kho: { select: { Id: true, TenKho: true } },
            },
          },
        },
        orderBy: [{ ThoiGian: "desc" }, { Id: "desc" }],
        skip: (BoLoc.Trang - 1) * BoLoc.KichThuocTrang,
        take: BoLoc.KichThuocTrang,
      }),
    ]);
    return PhanHoi.json({
      DanhSach: DanhSach,
      TongSo: TongSo,
      Trang: BoLoc.Trang,
      KichThuocTrang: BoLoc.KichThuocTrang,
    });
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
