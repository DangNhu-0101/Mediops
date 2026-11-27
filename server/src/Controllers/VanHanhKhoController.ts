import { LoiXungDotDuLieu } from "../Services/LoiNghiepVuService.js";
import { PhuongThucQuet, TinhTrangTraThietBi } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import { PhatCapNhatLich } from "../Services/SocketService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import { LayCaQuayCuaNguoiDungTheoNgay } from "../Services/CaQuayService.js";
import {
  KiemTraViTriKho as KiemTraViTriKhoTrongHeThong,
  LayChecklistXuatKho,
  LayChecklistNhapKho,
  LayDanhSachKho,
  NhapKhoTheoLo,
  TraCuuThietBiNhapKho as TraCuuThietBiNhapKhoTrongHeThong,
  TraCuuThietBiTrongLo,
  XuatKhoTheoLo,
} from "../Services/VanHanhKhoService.js";
import { LoiVanHanhKho } from "../Services/LoiNghiepVuService.js";
import {
  LayNgayHienTaiVietNam,
  TaoKhoangNgayVietNam,
} from "../Services/ThoiGianVietNamService.js";

const ThamSoCaQuayHomNaySchema = z
  .object({
    Ngay: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ")
      .optional(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

class LoiNgayKhongHopLe extends Error {}

export function TaoKhoangNgay(Ngay: string) {
  try {
    return TaoKhoangNgayVietNam(Ngay);
  } catch {
    throw new LoiNgayKhongHopLe("Ngày không hợp lệ");
  }
}

export { LayNgayHienTaiVietNam as LayNgayHienTaiVietNamNoiBo };

export async function LayCaQuayHomNay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const ThamSo = ThamSoCaQuayHomNaySchema.parse(YeuCau.query);
    const Ngay = ThamSo.Ngay ?? LayNgayHienTaiVietNam();
    const DanhSach = await LayCaQuayCuaNguoiDungTheoNgay({
      DonViId: LayDonViId(YeuCau),
      NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
      ToanDonVi:
        YeuCau.NguoiDung!.QuanTriDonVi ||
        Boolean(YeuCau.NguoiDung!.Quyen?.includes("VanHanhKho.ToanDonVi")),
      ...TaoKhoangNgay(Ngay),
    });
    return PhanHoi.json(
      DanhSach.map(({ DanhSachThietBi: DanhSachThietBi, ...CaQuay }) => ({
        ...CaQuay,
        TomTatThietBi: {
          TongSo: DanhSachThietBi.length,
          ChoXuatKho: DanhSachThietBi.filter(
            (PhanCong) => PhanCong.TrangThaiMuonTra === "CHO_XUAT_KHO",
          ).length,
          DaXuatKho: DanhSachThietBi.filter(
            (PhanCong) => PhanCong.TrangThaiMuonTra === "DA_XUAT_KHO",
          ).length,
          DaNhapKho: DanhSachThietBi.filter(
            (PhanCong) => PhanCong.TrangThaiMuonTra === "DA_NHAP_KHO",
          ).length,
        },
      })),
    );
  } catch (Loi) {
    if (Loi instanceof z.ZodError || Loi instanceof LoiNgayKhongHopLe) {
      return PhanHoi.status(400).json({
        ThongBao:
          Loi instanceof z.ZodError
            ? (Loi.issues[0]?.message ?? "Ngày không hợp lệ")
            : Loi.message,
      });
    }
    return TiepTheo(Loi);
  }
}
export async function LayChecklist(YeuCau: YeuCauXacThuc, PhanHoi: Response) {
  try {
    const CaQuayId = z
      .string()
      .uuid("Ca quay không hợp lệ")
      .parse(YeuCau.params.caQuayId);
    return PhanHoi.json(
      await LayChecklistXuatKho(CaQuayId, LayDonViId(YeuCau)),
    );
  } catch (Loi) {
    return XuLyLoiVanHanhKho(PhanHoi, Loi);
  }
}

const ViTriSchema = z
  .object({
    ViDo: z.number().finite().min(-90).max(90),
    KinhDo: z.number().finite().min(-180).max(180),
    DoChinhXacMet: z.number().finite().positive(),
    ThoiDiemGhiNhan: z.string().datetime({ offset: true }),
  })
  .strict("Dữ liệu vị trí chứa trường không được hỗ trợ");

const XuatKhoSchema = z
  .object({
    LoThayTheId: z.string().uuid().optional(),
    CaQuayId: z.string().uuid("Ca quay không hợp lệ"),
    KhoId: z.string().uuid("Kho không hợp lệ"),
    DanhSachThietBi: z
      .array(
        z
          .object({
            ThietBiId: z.string().uuid("Thiết bị không hợp lệ"),
            MaQR: z
              .string({
                required_error: "Vui lòng quét mã QR thiết bị",
                invalid_type_error: "Mã QR không hợp lệ",
              })
              .trim()
              .min(1, "Vui lòng quét mã QR thiết bị")
              .max(100),
            PhuongThuc: z.nativeEnum(PhuongThucQuet),
          })
          .strict("Thiết bị chứa trường không được hỗ trợ"),
      )
      .min(1, "Vui lòng quét đầy đủ thiết bị trước khi xác nhận")
      .max(200, "Một lô không được vượt quá 200 thiết bị"),
    ViTri: ViTriSchema,
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

const NhapKhoSchema = z
  .object({
    CaQuayId: z.string().uuid("Ca quay không hợp lệ"),
    KhoDichId: z.string().uuid("Kho nhập không hợp lệ"),
    DanhSachThietBi: z
      .array(
        z
          .object({
            ThietBiId: z.string().uuid("Thiết bị không hợp lệ"),
            MaQR: z
              .string({
                required_error: "Vui lòng quét mã QR thiết bị",
                invalid_type_error: "Mã QR không hợp lệ",
              })
              .trim()
              .min(1, "Vui lòng quét mã QR thiết bị")
              .max(100),
            PhuongThuc: z.nativeEnum(PhuongThucQuet),
            TinhTrang: z.nativeEnum(TinhTrangTraThietBi),
            GhiChu: z.string().trim().max(1000).optional(),
          })
          .strict("Thiết bị chứa trường không được hỗ trợ"),
      )
      .min(1, "Vui lòng quét đầy đủ thiết bị trước khi xác nhận")
      .max(200, "Một lô không được vượt quá 200 thiết bị"),
    ViTri: ViTriSchema,
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

function ChuyenViTri(ViTri: z.infer<typeof ViTriSchema>) {
  return { ...ViTri, ThoiDiemGhiNhan: new Date(ViTri.ThoiDiemGhiNhan) };
}

function XuLyLoiVanHanhKho(PhanHoi: Response, Loi: unknown) {
  if (Loi instanceof z.ZodError) {
    return PhanHoi.status(400).json({
      ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      MaLoi: "DU_LIEU_KHONG_HOP_LE",
    });
  }
  if (Loi instanceof LoiXungDotDuLieu)
    return PhanHoi.status(409).json({ ThongBao: Loi.message });
  if (Loi instanceof LoiVanHanhKho) {
    return PhanHoi.status(Loi.MaTrangThai).json({
      ThongBao: Loi.message,
      MaLoi: Loi.MaLoi,
      ...Loi.DuLieuBoSung,
    });
  }
  throw Loi;
}

export async function LayCacKho(YeuCau: YeuCauXacThuc, PhanHoi: Response) {
  return PhanHoi.json(
    await LayDanhSachKho(
      LayDonViId(YeuCau),
      YeuCau.query.BaoGomKhoNgungHoatDong === "true",
    ),
  );
}

export async function LayChecklistNhap(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
) {
  try {
    const CaQuayId = z
      .string()
      .uuid("Ca quay không hợp lệ")
      .parse(YeuCau.params.caQuayId);
    return PhanHoi.json(
      await LayChecklistNhapKho(CaQuayId, LayDonViId(YeuCau)),
    );
  } catch (Loi) {
    return XuLyLoiVanHanhKho(PhanHoi, Loi);
  }
}

export async function TraCuuThietBiXuatKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
) {
  try {
    const ThamSo = z
      .object({
        CaQuayId: z.string().uuid("Ca quay không hợp lệ"),
        KhoId: z.string().uuid("Kho không hợp lệ"),
        MaQR: z.string().trim().min(1).max(100),
      })
      .strict("Dữ liệu chứa trường không được hỗ trợ")
      .parse(YeuCau.query);
    return PhanHoi.json(await TraCuuThietBiTrongLo(ThamSo, LayDonViId(YeuCau)));
  } catch (Loi) {
    return XuLyLoiVanHanhKho(PhanHoi, Loi);
  }
}

export async function TraCuuThietBiNhapKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
) {
  try {
    const ThamSo = z
      .object({
        CaQuayId: z.string().uuid("Ca quay không hợp lệ"),
        MaQR: z.string().trim().min(1).max(100),
      })
      .strict("Dữ liệu chứa trường không được hỗ trợ")
      .parse(YeuCau.query);
    return PhanHoi.json(
      await TraCuuThietBiNhapKhoTrongHeThong(ThamSo, LayDonViId(YeuCau)),
    );
  } catch (Loi) {
    return XuLyLoiVanHanhKho(PhanHoi, Loi);
  }
}

export async function KiemTraViTriKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
) {
  try {
    const DuLieu = z
      .object({
        KhoId: z.string().uuid("Kho không hợp lệ"),
        ViTri: ViTriSchema,
      })
      .strict("Dữ liệu chứa trường không được hỗ trợ")
      .parse(YeuCau.body);
    return PhanHoi.json(
      await KiemTraViTriKhoTrongHeThong(
        DuLieu.KhoId,
        ChuyenViTri(DuLieu.ViTri),
        LayDonViId(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoiVanHanhKho(PhanHoi, Loi);
  }
}

export async function XuatKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const DuLieu = XuatKhoSchema.parse(YeuCau.body);
    const DonViId = LayDonViId(YeuCau);
    const KetQua = await XuatKhoTheoLo(
      { ...DuLieu, ViTri: ChuyenViTri(DuLieu.ViTri) },
      YeuCau.NguoiDung!.nguoiDungId,
      DonViId,
    );
    await PhatCapNhatLich(
      "kho:xuat-kho",
      { CaQuayId: DuLieu.CaQuayId, GiaoDichId: KetQua.GiaoDichId },
      DuLieu.CaQuayId,
      DonViId,
    );
    return PhanHoi.status(201).json(KetQua);
  } catch (Loi) {
    try {
      return XuLyLoiVanHanhKho(PhanHoi, Loi);
    } catch (LoiKhongXuLy) {
      if (TiepTheo) return TiepTheo(LoiKhongXuLy);
      throw LoiKhongXuLy;
    }
  }
}
export async function NhapKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo?: NextFunction,
) {
  try {
    const DuLieu = NhapKhoSchema.parse(YeuCau.body);
    const DonViId = LayDonViId(YeuCau);
    const KetQua = await NhapKhoTheoLo(
      { ...DuLieu, ViTri: ChuyenViTri(DuLieu.ViTri) },
      YeuCau.NguoiDung!.nguoiDungId,
      DonViId,
    );
    await PhatCapNhatLich(
      "kho:nhap-kho",
      { CaQuayId: DuLieu.CaQuayId, GiaoDichId: KetQua.GiaoDichId },
      DuLieu.CaQuayId,
      DonViId,
    );
    if (DuLieu.DanhSachThietBi.some((Muc) => Muc.TinhTrang !== "BINH_THUONG")) {
      await PhatCapNhatLich(
        "bao_tri:cap_nhat",
        { CaQuayId: DuLieu.CaQuayId },
        DuLieu.CaQuayId,
        DonViId,
      );
    }
    return PhanHoi.status(201).json(KetQua);
  } catch (Loi) {
    try {
      return XuLyLoiVanHanhKho(PhanHoi, Loi);
    } catch (LoiKhongXuLy) {
      if (TiepTheo) return TiepTheo(LoiKhongXuLy);
      throw LoiKhongXuLy;
    }
  }
}
