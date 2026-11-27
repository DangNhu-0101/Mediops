import { CacYeuCauSchema, ThanhJson } from "../Services/DuLieuNhungService.js";
import { TrangThaiCaQuay } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import {
  CapNhatCaQuay as CapNhatCaQuayTrongHeThong,
  LayChiTietCaQuay as LayChiTietCaQuayTrongHeThong,
  LayDanhSachCaQuay as LayDanhSachCaQuayTrongHeThong,
  TaoCaQuay as TaoCaQuayTrongHeThong,
  XoaCaQuay as XoaCaQuayTrongHeThong,
} from "../Services/CaQuayService.js";
import {
  LoiDuLieuKhongHopLe,
  LoiKhongTimThay,
  LoiXungDotDuLieu,
  LoiXungDotLichCaQuay,
} from "../Services/LoiNghiepVuService.js";
import { TimThietBiThayThe } from "../Services/ThuatToanGoiYService.js";
import {
  ApDungPhuongAnGiaiQuyet,
  GoiYGiaiQuyetXungDot,
} from "../Services/ThuatToanGiaiQuyetXungDotService.js";
import { KiemTraXungDotToanDien } from "../Services/ThuatToanXungDotService.js";
import { DemToiDaPhut } from "../Services/ThoiGianHieuLucService.js";
import { PhatCapNhatLich } from "../Services/SocketService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";

const IdSchema = z.string().uuid("Mã định danh không hợp lệ");
const DuLieuCaQuayCoBanSchema = z
  .object({
    CacYeuCauTaiNguyen: CacYeuCauSchema.transform(ThanhJson).optional(),
    MaCaQuay: z.string().trim().min(1).max(50).optional(),
    DuAnId: IdSchema,
    TieuDe: z
      .string()
      .trim()
      .min(2, "Tên ca quay phải có ít nhất 2 ký tự")
      .max(200),
    ThoiGianBatDau: z.coerce.date(),
    ThoiGianKetThuc: z.coerce.date(),
    PhongStudioId: IdSchema.nullable().optional(),
    GhiChuDiaDiem: z.string().trim().max(500).optional(),
    NguoiPhuTrachId: IdSchema,
    TrangThai: z.nativeEnum(TrangThaiCaQuay).optional(),
    GhiChu: z.string().trim().max(2000).optional(),
    MucDoUuTien: z.number().int().min(0).max(100).optional(),
    CoTheDoiLich: z.boolean().optional(),
    ThoiGianBatDauSomNhat: z.coerce.date().nullable().optional(),
    ThoiGianKetThucMuonNhat: z.coerce.date().nullable().optional(),
    ThoiGianChuanBiPhut: z.number().int().min(0).max(DemToiDaPhut).optional(),
    ThoiGianThuHoiPhut: z.number().int().min(0).max(DemToiDaPhut).optional(),
    DanhSachThietBiId: z.array(IdSchema).optional(),
    DanhSachNhanSu: z
      .array(
        z.object({
          NguoiDungId: IdSchema,
          ChucDanhPhanCong: z.string().trim().min(1).max(100),
        }),
      )
      .optional(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

export const DuLieuCaQuaySchema = DuLieuCaQuayCoBanSchema.refine(
  (DuLieu) => DuLieu.ThoiGianKetThuc > DuLieu.ThoiGianBatDau,
  "Thời gian kết thúc phải sau thời gian bắt đầu",
);

const DuLieuKiemTraXungDotSchema = z
  .object({
    ThoiGianBatDau: z.coerce.date(),
    ThoiGianKetThuc: z.coerce.date(),
    PhongStudioId: IdSchema.nullable().optional(),
    DanhSachThietBiId: z.array(IdSchema).optional(),
    DanhSachNhanSuId: z.array(IdSchema).optional(),
    NguoiPhuTrachId: IdSchema.optional(),
    CaQuayHienTaiId: IdSchema.optional(),
    ThoiGianChuanBiPhut: z.number().int().min(0).max(DemToiDaPhut).optional(),
    ThoiGianThuHoiPhut: z.number().int().min(0).max(DemToiDaPhut).optional(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ")
  .refine(
    (DuLieu) => DuLieu.ThoiGianKetThuc > DuLieu.ThoiGianBatDau,
    "Thời gian kết thúc phải sau thời gian bắt đầu",
  );

const ThamSoGoiYThayTheSchema = z
  .object({
    ThietBiGocId: IdSchema,
    CaQuayId: IdSchema.optional(),
    ThoiGianBatDau: z.coerce.date().optional(),
    ThoiGianKetThuc: z.coerce.date().optional(),
  })
  .refine(
    (DuLieu) =>
      Boolean(DuLieu.CaQuayId) ||
      Boolean(DuLieu.ThoiGianBatDau && DuLieu.ThoiGianKetThuc),
    "Cần cung cấp ca quay hoặc đầy đủ khoảng thời gian",
  )
  .refine(
    (DuLieu) =>
      !DuLieu.ThoiGianBatDau ||
      !DuLieu.ThoiGianKetThuc ||
      DuLieu.ThoiGianKetThuc > DuLieu.ThoiGianBatDau,
    "Thời gian kết thúc phải sau thời gian bắt đầu",
  );

const ThamSoDanhSachCaQuaySchema = z
  .object({
    TuNgay: z.coerce.date().optional(),
    DenNgay: z.coerce.date().optional(),
    PhongStudioId: IdSchema.optional(),
    DuAnId: IdSchema.optional(),
    TrangThai: z.nativeEnum(TrangThaiCaQuay).optional(),
  })
  .refine(
    (DuLieu) =>
      !DuLieu.TuNgay || !DuLieu.DenNgay || DuLieu.DenNgay > DuLieu.TuNgay,
    "Khoảng ngày lọc không hợp lệ",
  );

const DuLieuApDungPhuongAnSchema = z
  .object({
    PhuongAnId: z.string().trim().min(1).max(200),
    MaPhienBan: z
      .string()
      .regex(/^[a-f0-9]{64}$/i, "Mã phiên bản không hợp lệ"),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

export function KiemTraPhanCongKhongTrung(DuLieu: {
  DanhSachThietBiId?: string[];
  DanhSachNhanSu?: { NguoiDungId: string; ChucDanhPhanCong: string }[];
}) {
  if (
    DuLieu.DanhSachThietBiId &&
    new Set(DuLieu.DanhSachThietBiId).size !== DuLieu.DanhSachThietBiId.length
  ) {
    throw new LoiXungDotDuLieu(
      "Không thể phân công trùng thiết bị trong một ca quay",
    );
  }
  const DanhSachNhanSuId = DuLieu.DanhSachNhanSu?.map(
    (PhanCong) => PhanCong.NguoiDungId,
  );
  if (
    DanhSachNhanSuId &&
    new Set(DanhSachNhanSuId).size !== DanhSachNhanSuId.length
  ) {
    throw new LoiXungDotDuLieu(
      "Không thể phân công trùng nhân sự trong một ca quay",
    );
  }
}

const DuLieuCapNhatCaQuaySchema = DuLieuCaQuayCoBanSchema.partial()
  .refine(
    (DuLieu) => Object.keys(DuLieu).length > 0,
    "Cần có dữ liệu để cập nhật",
  )
  .refine(
    (DuLieu) =>
      !DuLieu.ThoiGianBatDau ||
      !DuLieu.ThoiGianKetThuc ||
      DuLieu.ThoiGianKetThuc > DuLieu.ThoiGianBatDau,
    "Thời gian kết thúc phải sau thời gian bắt đầu",
  );

function XuLyLoi(PhanHoi: Response, TiepTheo: NextFunction, Loi: unknown) {
  if (Loi instanceof z.ZodError) {
    return PhanHoi.status(400).json({
      ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    });
  }
  if (Loi instanceof LoiKhongTimThay) {
    return PhanHoi.status(404).json({ ThongBao: Loi.message });
  }
  if (Loi instanceof LoiDuLieuKhongHopLe) {
    return PhanHoi.status(400).json({ ThongBao: Loi.message });
  }
  if (Loi instanceof LoiXungDotLichCaQuay) {
    return PhanHoi.status(409).json({
      ThongBao: Loi.message,
      MaLoi: "XUNG_DOT_LICH_CA_QUAY",
      DanhSachXungDot: Loi.DanhSachXungDot,
    });
  }
  if (Loi instanceof LoiXungDotDuLieu) {
    return PhanHoi.status(409).json({ ThongBao: Loi.message });
  }
  return TiepTheo(Loi);
}

export async function LayDanhSachCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const ThamSo = ThamSoDanhSachCaQuaySchema.parse(YeuCau.query);
    return PhanHoi.json(
      await LayDanhSachCaQuayTrongHeThong({
        DonViId: LayDonViId(YeuCau),
        ...ThamSo,
        NguoiDungId: YeuCau.NguoiDung?.Quyen?.includes("CaQuay.Xem")
          ? undefined
          : YeuCau.NguoiDung!.nguoiDungId,
      }),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function KiemTraXungDotCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DuLieu = DuLieuKiemTraXungDotSchema.parse(YeuCau.body);
    return PhanHoi.json(
      await KiemTraXungDotToanDien({
        ...DuLieu,
        DonViId: LayDonViId(YeuCau),
      }),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function GoiYThietBiThayThe(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const ThamSo = ThamSoGoiYThayTheSchema.parse(YeuCau.query);
    return PhanHoi.json({
      DanhSachGoiY: await TimThietBiThayThe({
        ...ThamSo,
        DonViId: LayDonViId(YeuCau),
      }),
    });
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function GoiYGiaiQuyetXungDotCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const CaQuayId = IdSchema.parse(YeuCau.params.id);
    return PhanHoi.json(
      await GoiYGiaiQuyetXungDot(CaQuayId, LayDonViId(YeuCau)),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function ApDungGiaiQuyetXungDotCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const CaQuayId = IdSchema.parse(YeuCau.params.id);
    const DuLieu = DuLieuApDungPhuongAnSchema.parse(YeuCau.body);
    const DonViId = LayDonViId(YeuCau);
    const KetQua = await ApDungPhuongAnGiaiQuyet({
      CaQuayId: CaQuayId,
      DonViId: DonViId,
      ...DuLieu,
    });
    await PhatCapNhatLich(
      "ca_quay:cap_nhat",
      { CaQuayId: CaQuayId },
      CaQuayId,
      DonViId,
    );
    return PhanHoi.json(KetQua);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayChiTietCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayChiTietCaQuayTrongHeThong(
        String(YeuCau.params.id),
        LayDonViId(YeuCau),
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TaoCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const DonViId = LayDonViId(YeuCau);
    const CaQuay = await TaoCaQuayTrongHeThong(
      (() => {
        const DuLieu = DuLieuCaQuaySchema.parse(YeuCau.body);
        KiemTraPhanCongKhongTrung(DuLieu);
        return DuLieu;
      })(),
      DonViId,
    );
    await PhatCapNhatLich(
      "ca_quay:tao",
      { CaQuayId: CaQuay.Id },
      CaQuay.Id,
      DonViId,
    );
    return PhanHoi.status(201).json(CaQuay);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const CaQuayId = String(YeuCau.params.id);
    const DonViId = LayDonViId(YeuCau);
    const CaQuay = await CapNhatCaQuayTrongHeThong(
      CaQuayId,
      (() => {
        const DuLieu = DuLieuCapNhatCaQuaySchema.parse(YeuCau.body);
        KiemTraPhanCongKhongTrung(DuLieu);
        return DuLieu;
      })(),
      DonViId,
    );
    await PhatCapNhatLich(
      "ca_quay:cap_nhat",
      { CaQuayId: CaQuayId },
      CaQuayId,
      DonViId,
    );
    return PhanHoi.json(CaQuay);
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function XoaCaQuay(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const CaQuayId = String(YeuCau.params.id);
    const DonViId = LayDonViId(YeuCau);
    await XoaCaQuayTrongHeThong(CaQuayId, DonViId);
    await PhatCapNhatLich(
      "ca_quay:xoa",
      { CaQuayId: CaQuayId },
      undefined,
      DonViId,
    );
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
